from __future__ import annotations

from pathlib import Path
from textwrap import wrap

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "SmartStudy_AI_rapport.pdf"


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="TitleCenter",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=28,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=14,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SubtitleCenter",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=11,
            leading=15,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#334155"),
            spaceAfter=14,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=19,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=12,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodyJustified",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.2,
            leading=14,
            alignment=TA_JUSTIFY,
            textColor=colors.HexColor("#111827"),
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SmallNote",
            parent=styles["BodyText"],
            fontName="Helvetica-Oblique",
            fontSize=9,
            leading=12,
            alignment=TA_JUSTIFY,
            textColor=colors.HexColor("#475569"),
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="MonoBlock",
            parent=styles["Code"],
            fontName="Courier",
            fontSize=8.2,
            leading=11,
            textColor=colors.HexColor("#0f172a"),
            backColor=colors.HexColor("#f8fafc"),
            borderPadding=6,
            leftIndent=0,
            spaceAfter=6,
        )
    )
    return styles


def p(text: str, style: ParagraphStyle):
    return Paragraph(text.replace("\n", "<br/>"), style)


def bullet_list(items, styles, bullet_char="•"):
    result = []
    for item in items:
        result.append(Paragraph(f"{bullet_char} {item}", styles["BodyJustified"]))
    return result


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#0f172a"))
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(doc.leftMargin, A4[1] - 1.4 * cm, "SmartStudy AI - Rapport d'explication")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#475569"))
    canvas.drawRightString(A4[0] - doc.rightMargin, A4[1] - 1.4 * cm, f"Page {canvas.getPageNumber()}")
    canvas.setStrokeColor(colors.HexColor("#cbd5e1"))
    canvas.setLineWidth(0.6)
    canvas.line(doc.leftMargin, A4[1] - 1.65 * cm, A4[0] - doc.rightMargin, A4[1] - 1.65 * cm)
    canvas.line(doc.leftMargin, 1.55 * cm, A4[0] - doc.rightMargin, 1.55 * cm)
    canvas.restoreState()


def cover_page(canvas, doc):
    canvas.saveState()

    width, height = A4
    canvas.setFillColor(colors.HexColor("#06101f"))
    canvas.rect(0, 0, width, height, stroke=0, fill=1)

    canvas.setFillColor(colors.HexColor("#0b1b33"))
    canvas.circle(width * 0.86, height * 0.84, 150, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#123a6f"))
    canvas.circle(width * 0.16, height * 0.82, 120, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#1d4ed8"))
    canvas.circle(width * 0.78, height * 0.18, 90, stroke=0, fill=1)

    canvas.setFillColor(colors.HexColor("#60a5fa"))
    canvas.setFont("Helvetica-Bold", 11)
    canvas.drawString(doc.leftMargin, height - 2.1 * cm, "Rapport de projet")

    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 28)
    canvas.drawString(doc.leftMargin, height - 4.2 * cm, "SmartStudy AI")

    canvas.setFont("Helvetica", 13)
    canvas.setFillColor(colors.HexColor("#cbd5e1"))
    text = "Une application d'étude intelligente qui transforme des documents en révision active, suivis de progression et outils d'apprentissage."
    text_object = canvas.beginText(doc.leftMargin, height - 5.2 * cm)
    text_object.setLeading(18)
    for line in wrap(text, 78):
        text_object.textLine(line)
    canvas.drawText(text_object)

    canvas.setFillColor(colors.HexColor("#0f172a"))
    canvas.roundRect(doc.leftMargin, height - 8.8 * cm, 8.2 * cm, 2.0 * cm, 14, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#e2e8f0"))
    canvas.setFont("Helvetica-Bold", 11)
    canvas.drawString(doc.leftMargin + 0.55 * cm, height - 7.75 * cm, "Angle du projet")
    canvas.setFont("Helvetica", 10)
    canvas.setFillColor(colors.HexColor("#93c5fd"))
    canvas.drawString(doc.leftMargin + 0.55 * cm, height - 8.2 * cm, "Productivité, mémorisation active et suivi pédagogique")

    canvas.setFillColor(colors.HexColor("#ffffff"))
    canvas.roundRect(doc.leftMargin, height - 11.6 * cm, 16.2 * cm, 2.2 * cm, 18, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#0f172a"))
    canvas.setFont("Helvetica-Bold", 10)
    canvas.drawString(doc.leftMargin + 0.55 * cm, height - 10.8 * cm, "Ce que le professeur verra immédiatement")
    canvas.setFont("Helvetica", 9.2)
    canvas.setFillColor(colors.HexColor("#334155"))
    canvas.drawString(doc.leftMargin + 0.55 * cm, height - 11.25 * cm, "Une architecture claire, des modules bien séparés, un vrai parcours utilisateur et une logique métier cohérente.")

    canvas.setFillColor(colors.HexColor("#93c5fd"))
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(doc.leftMargin, 1.9 * cm, "Projet de fin de semestre - documentation synthétique et visuelle")

    canvas.restoreState()


def page_decorator(canvas, doc):
    if canvas.getPageNumber() == 1:
        cover_page(canvas, doc)
    else:
        header_footer(canvas, doc)


def module_table(styles):
    data = [
        ["Module", "Rôle"],
        ["core/", "Initialisation de l'application, configuration, logging et cycle de vie."],
        ["db/", "Accès SQLite, modèles de données, requêtes CRUD et migrations."],
        ["api/", "Clients HTTP vers les services externes et compatibilité REST."],
        ["auth/", "JWT et OAuth GitHub / Google."],
        ["chat/", "Moteur de conversation contextuel."],
        ["pdf/", "Extraction et analyse de documents PDF."],
        ["review/", "Flashcards, quiz, répétition espacée."],
        ["progress/", "Suivi de la progression et des statistiques."],
        ["mindmap/", "Génération de cartes mentales."],
        ["frontend/", "Interface Next.js pour les écrans utilisateur."],
    ]

    table = Table(data, colWidths=[4.1 * cm, 11.2 * cm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1d4ed8")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("LEADING", (0, 0), (-1, -1), 11),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def callout(title, text, styles, accent="#1d4ed8"):
    table = Table(
        [[Paragraph(f"<b>{title}</b><br/>{text}", styles["BodyJustified"]) ]],
        colWidths=[16.3 * cm],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 1.0, colors.HexColor(accent)),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def main():
    styles = build_styles()
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=2.2 * cm,
        bottomMargin=1.9 * cm,
        title="SmartStudy AI - Rapport",
        author="GitHub Copilot",
    )

    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=page_decorator)])

    story = []

    story.append(Spacer(1, 21 * cm))
    story.append(PageBreak())

    story.append(p("1. Vue d'ensemble", styles["SectionTitle"]))
    story.append(p(
        "SmartStudy AI est une plateforme d'étude intelligente pensée pour convertir un simple dépôt de cours en expérience d'apprentissage guidée. "
        "Le projet associe extraction de contenu, génération d'outils de révision et suivi de progression dans une architecture légère, locale et modulaire.",
        styles["BodyJustified"],
    ))
    story.append(callout(
        "Message à retenir",
        "L'application ne se contente pas de stocker des documents: elle les transforme en support actif de révision, avec des flashcards, des quiz, un chat contextuel et des indicateurs de progression.",
        styles,
        accent="#2563eb",
    ))

    story.append(Spacer(1, 0.15 * cm))
    story.append(p("2. Architecture globale", styles["SectionTitle"]))
    story.append(p(
        "Le dépôt est organisé en monorepo avec un backend principal en C et un frontend moderne en Next.js. "
        "Le backend expose les API, gère la persistance et orchestre les traitements. Le frontend fournit les écrans d'authentification, le tableau de bord et les vues métier."
        , styles["BodyJustified"]))
    story.append(module_table(styles))

    story.append(Spacer(1, 0.25 * cm))
    story.append(p("3. Point d'entrée et cycle de vie", styles["SectionTitle"]))
    lifecycle = [
        "Le point d'entrée du backend est src/main.c. Il parse les arguments CLI, charge le fichier .env, initialise l'application et lance le serveur HTTP.",
        "Le struct SmartStudyApp, défini dans include/core/app.h, sert de contexte global pour conserver le handle de base de données, le chemin de configuration et l'état d'initialisation.",
        "La fonction app_init() de src/core/app.c charge la configuration, initialise le logger, ouvre SQLite, applique le schéma SQL et démarre le sous-système HTTP.",
        "La fonction app_shutdown() ferme proprement la base, nettoie HTTP et libère la configuration.",
    ]
    for item in lifecycle:
        story.append(p(item, styles["BodyJustified"]))
    story.append(callout(
        "Point fort technique",
        "Le backend garde une séparation nette entre initialisation, persistance et serveur HTTP. Cela facilite les tests, le débogage et l'évolution du projet.",
        styles,
        accent="#0ea5e9",
    ))

    story.append(p("4. Gestion des données", styles["SectionTitle"]))
    data_points = [
        "La couche include/db/db.h définit les structures DBUser, DBDocument, DBFlashcard et DBChatMessage.",
        "La couche src/db/db_sqlite.c fournit les fonctions CRUD, avec requêtes préparées, gestion des résultats et libération mémoire dédiée.",
        "Les migrations sont chargées depuis data/schema.sql afin d'initialiser les tables et les contraintes.",
        "SQLite est choisi pour sa simplicité de déploiement et sa compatibilité avec une application locale ou embarquée.",
    ]
    for item in data_points:
        story.append(p(item, styles["BodyJustified"]))

    story.append(p("5. Authentification", styles["SectionTitle"]))
    auth_points = [
        "Le backend expose /api/auth/register, /api/auth/login et /api/auth/me.",
        "L'inscription vérifie l'email, le nom d'utilisateur et la longueur du mot de passe avant de créer le compte.",
        "Les comptes stockent leurs préférences dans settings_json, ce qui permet de conserver le nom d'utilisateur et le provider d'authentification.",
        "Le frontend sait basculer entre backend local, Supabase et mode démo selon la disponibilité de l'API.",
    ]
    for item in auth_points:
        story.append(p(item, styles["BodyJustified"]))
    story.append(callout(
        "Lecture par le professeur",
        "Ce bloc montre que l'authentification est pensée comme un vrai système hybride: serveur local en priorité, Supabase en secours, puis mode démo si tout est indisponible.",
        styles,
        accent="#7c3aed",
    ))

    story.append(p("6. Modules fonctionnels", styles["SectionTitle"]))
    functional_points = [
        "PDF: extraction du texte à partir de documents importés, puis préparation pour l'analyse.",
        "Chat: moteur conversationnel lié au contexte du document et de la session utilisateur.",
        "Review: génération de flashcards, quiz et répétition espacée.",
        "Progress: calcul d'indicateurs comme le niveau, l'XP et la régularité de travail.",
        "Mindmap: organisation visuelle des idées pour aider à la mémorisation.",
    ]
    for item in functional_points:
        story.append(p(item, styles["BodyJustified"]))
    story.append(p("L'intérêt de ces modules est de couvrir tout le cycle d'étude: ingestion, compréhension, entraînement et suivi dans le temps.", styles["SmallNote"]))

    story.append(p("7. Frontend", styles["SectionTitle"]))
    frontend_points = [
        "Le frontend se trouve dans frontend/ et utilise Next.js avec des pages dédiées au login, à l'inscription, au tableau de bord, aux documents, au chat, aux flashcards, au quiz et aux paramètres.",
        "Les pages d'authentification gèrent les formulaires, les erreurs réseau, le fallback Supabase et le mode démo.",
        "La page d'accueil met en avant la promesse produit: réviser plus intelligemment, mémoriser plus rapidement.",
        "Le design utilise une esthétique sombre avec halos, gradients et cartes vitrées pour renforcer l'identité du produit.",
    ]
    for item in frontend_points:
        story.append(p(item, styles["BodyJustified"]))
    story.append(callout(
        "Pourquoi ça attire l'attention",
        "L'interface a une direction visuelle marquée: contrastes forts, couleurs froides, fonds atmosphériques et cartes lumineuses. Cela donne une impression de produit abouti plutôt qu'un simple prototype.",
        styles,
        accent="#1d4ed8",
    ))

    story.append(PageBreak())
    story.append(p("8. Commandes et exécution", styles["SectionTitle"]))
    commands = [
        "make all: compilation complète du backend C.",
        "make test: exécution de la suite de tests unitaires.",
        "make run: compilation puis lancement de l'application.",
        "npm run dev:web: démarrage du frontend Next.js.",
        "./build/bin/smartstudy --register --email ... --username ... --password ...: création d'un compte depuis le terminal.",
    ]
    for item in commands:
        story.append(p(item, styles["BodyJustified"]))
    story.append(callout(
        "Astuce de présentation",
        "Pendant l'oral, tu peux montrer que le projet est exploitable en local, qu'il possède des tests et qu'il couvre toute la chaîne d'usage du document à la révision.",
        styles,
        accent="#10b981",
    ))

    story.append(p("9. Flux de fonctionnement simplifié", styles["SectionTitle"]))
    flow = [
        "1) L'utilisateur ouvre le frontend et se connecte ou s'inscrit.",
        "2) Il importe un document PDF ou démarre un espace de révision.",
        "3) Le backend traite le document, conserve l'état en SQLite et expose les données utiles au frontend.",
        "4) L'application génère des flashcards, des quiz, un suivi de progression et des vues de synthèse.",
        "5) L'utilisateur revient dans le temps grâce aux révisions et à la progression historisée.",
    ]
    for item in flow:
        story.append(p(item, styles["BodyJustified"]))

    story.append(p("10. Points forts techniques", styles["SectionTitle"]))
    strengths = [
        "Architecture modulaire claire entre domaine, persistance, API et interface.",
        "Base SQLite locale simple à déployer.",
        "Fallback d'authentification robuste entre backend local, Supabase et démo.",
        "Jeu de tests existant pour les modules critiques.",
        "Frontend orienté produit avec une identité visuelle forte.",
    ]
    for item in strengths:
        story.append(p(item, styles["BodyJustified"]))
    story.append(callout(
        "Conclusion pour l'examinateur",
        "SmartStudy AI combine une vraie logique de produit, une architecture technique lisible et une expérience utilisateur convaincante. C'est ce mélange qui lui donne une bonne valeur de démonstration.",
        styles,
        accent="#f59e0b",
    ))

    story.append(p("Conclusion", styles["SectionTitle"]))
    story.append(p(
        "SmartStudy AI est donc une plateforme d'étude complète: le backend C sert de moteur de traitement et de persistance, "
        "le frontend assure l'expérience utilisateur, et les modules métier transforment des documents en outils concrets de révision. "
        "Le projet met l'accent sur la productivité, la mémorisation active et le suivi de l'apprentissage.",
        styles["BodyJustified"],
    ))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc.build(story)
    print(f"PDF generated at: {OUTPUT}")


if __name__ == "__main__":
    main()