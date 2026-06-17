#include "auth/jwt.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <openssl/hmac.h>
#include <openssl/evp.h>
#include <openssl/buffer.h>
#include "cJSON/cJSON.h"

// --- Base64URL Encoding/Decoding ---
static char* base64url_encode(const unsigned char *input, int length) {
    BIO *bmem, *b64;
    BUF_MEM *bptr;

    b64 = BIO_new(BIO_f_base64());
    bmem = BIO_new(BIO_s_mem());
    b64 = BIO_push(b64, bmem);
    BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL);
    BIO_write(b64, input, length);
    BIO_flush(b64);
    BIO_get_mem_ptr(b64, &bptr);

    char *buff = (char *)malloc(bptr->length + 1);
    memcpy(buff, bptr->data, bptr->length);
    buff[bptr->length] = 0;
    BIO_free_all(b64);

    // Convert Base64 to Base64URL
    for (int i = 0; i < bptr->length; i++) {
        if (buff[i] == '+') buff[i] = '-';
        else if (buff[i] == '/') buff[i] = '_';
    }
    // Remove padding '='
    char *p = strchr(buff, '=');
    if (p) *p = '\0';

    return buff;
}

static unsigned char* base64url_decode(const char *input, int *out_len) {
    int len = strlen(input);
    int pad = len % 4;
    int b64_len = len + (pad ? 4 - pad : 0);
    char *b64_str = (char *)malloc(b64_len + 1);
    strcpy(b64_str, input);

    // Convert Base64URL to Base64
    for (int i = 0; i < len; i++) {
        if (b64_str[i] == '-') b64_str[i] = '+';
        else if (b64_str[i] == '_') b64_str[i] = '/';
    }
    // Add padding
    for (int i = len; i < b64_len; i++) b64_str[i] = '=';
    b64_str[b64_len] = '\0';

    BIO *b64, *bmem;
    unsigned char *buffer = (unsigned char *)malloc(b64_len);
    b64 = BIO_new(BIO_f_base64());
    BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL);
    bmem = BIO_new_mem_buf(b64_str, b64_len);
    bmem = BIO_push(b64, bmem);
    *out_len = BIO_read(bmem, buffer, b64_len);
    BIO_free_all(bmem);
    free(b64_str);

    return buffer;
}

char* jwt_generate(int64_t user_id, const char *secret_key, int expiration_seconds) {
    // Header
    cJSON *header = cJSON_CreateObject();
    cJSON_AddStringToObject(header, "alg", "HS256");
    cJSON_AddStringToObject(header, "typ", "JWT");
    char *header_json = cJSON_PrintUnformatted(header);
    char *header_b64 = base64url_encode((unsigned char*)header_json, strlen(header_json));
    cJSON_Delete(header);
    free(header_json);

    // Payload
    cJSON *payload = cJSON_CreateObject();
    cJSON_AddNumberToObject(payload, "sub", (double)user_id);
    cJSON_AddNumberToObject(payload, "exp", (double)(time(NULL) + expiration_seconds));
    char *payload_json = cJSON_PrintUnformatted(payload);
    char *payload_b64 = base64url_encode((unsigned char*)payload_json, strlen(payload_json));
    cJSON_Delete(payload);
    free(payload_json);

    // Signature
    char *data_to_sign = (char*)malloc(strlen(header_b64) + strlen(payload_b64) + 2);
    sprintf(data_to_sign, "%s.%s", header_b64, payload_b64);

    unsigned char hash[EVP_MAX_MD_SIZE];
    unsigned int hash_len;
    HMAC(EVP_sha256(), secret_key, strlen(secret_key), 
         (unsigned char*)data_to_sign, strlen(data_to_sign), hash, &hash_len);

    char *signature_b64 = base64url_encode(hash, hash_len);

    // Final JWT
    char *jwt = (char*)malloc(strlen(data_to_sign) + strlen(signature_b64) + 2);
    sprintf(jwt, "%s.%s", data_to_sign, signature_b64);

    free(header_b64);
    free(payload_b64);
    free(data_to_sign);
    free(signature_b64);

    return jwt;
}

bool jwt_verify(const char *token, const char *secret_key, int64_t *out_user_id) {
    if (!token || !secret_key) return false;

    // Split token (header.payload.signature)
    char *token_copy = strdup(token);
    char *header_b64 = strtok(token_copy, ".");
    char *payload_b64 = strtok(NULL, ".");
    char *signature_b64 = strtok(NULL, ".");

    if (!header_b64 || !payload_b64 || !signature_b64) {
        free(token_copy);
        return false;
    }

    // Check signature
    char *data_to_sign = (char*)malloc(strlen(header_b64) + strlen(payload_b64) + 2);
    sprintf(data_to_sign, "%s.%s", header_b64, payload_b64);

    unsigned char hash[EVP_MAX_MD_SIZE];
    unsigned int hash_len;
    HMAC(EVP_sha256(), secret_key, strlen(secret_key), 
         (unsigned char*)data_to_sign, strlen(data_to_sign), hash, &hash_len);

    char *expected_signature_b64 = base64url_encode(hash, hash_len);
    bool sig_valid = (strcmp(signature_b64, expected_signature_b64) == 0);
    
    free(expected_signature_b64);
    free(data_to_sign);

    if (!sig_valid) {
        free(token_copy);
        return false;
    }

    // Decode Payload
    int payload_len;
    unsigned char *payload_json_bytes = base64url_decode(payload_b64, &payload_len);
    if (!payload_json_bytes) {
        free(token_copy);
        return false;
    }

    char *payload_json = (char*)malloc(payload_len + 1);
    memcpy(payload_json, payload_json_bytes, payload_len);
    payload_json[payload_len] = '\0';
    free(payload_json_bytes);

    cJSON *payload = cJSON_Parse(payload_json);
    free(payload_json);

    if (!payload) {
        free(token_copy);
        return false;
    }

    // Check expiration
    cJSON *exp = cJSON_GetObjectItem(payload, "exp");
    if (exp && cJSON_IsNumber(exp)) {
        if ((time_t)exp->valuedouble < time(NULL)) {
            cJSON_Delete(payload);
            free(token_copy);
            return false; // Expired
        }
    }

    // Get user ID
    if (out_user_id) {
        cJSON *sub = cJSON_GetObjectItem(payload, "sub");
        if (sub && cJSON_IsNumber(sub)) {
            *out_user_id = (int64_t)sub->valuedouble;
        }
    }

    cJSON_Delete(payload);
    free(token_copy);
    return true;
}
