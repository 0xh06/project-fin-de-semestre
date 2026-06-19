#ifndef SMARTSTUDY_OAUTH_H
#define SMARTSTUDY_OAUTH_H

#include <stdbool.h>

typedef struct {
    char *id;
    char *email;
    char *name;
} OAuthUserProfile;

// Free the user profile memory
void oauth_free_profile(OAuthUserProfile *profile);

// GitHub OAuth functions
bool oauth_github_exchange_code(const char *code, const char *client_id, const char *client_secret, char *out_access_token, size_t max_len);
OAuthUserProfile* oauth_github_get_user(const char *access_token);

// Google OAuth functions
bool oauth_google_exchange_code(const char *code, const char *client_id, const char *client_secret, const char *redirect_uri, char *out_access_token, size_t max_len);
OAuthUserProfile* oauth_google_get_user(const char *access_token);

#endif // SMARTSTUDY_OAUTH_H
