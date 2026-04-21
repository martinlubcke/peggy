# Peggy - Pärlplattegenerator 🎨

Peggy är en blixtsnabb, minimal webbapplikation i Vanilla TypeScript som förvandlar dina bilder till 29x29 pärlplattemönster direkt i webbläsaren.

Appen låter dig färgmatcha mot dina egna pärlor (genom att ta ett foto av din pärlhink) eller använda en standardpalett. Du kan beskära bilden, justera färg, kontrast och dithering i realtid och därefter ladda ner en färdig PDF-mall med inköpslista i exakt rätt fysisk skala.

## ✨ Funktioner
- **Kundanpassade paletter:** Analysera ett foto på din pärlhink för att skapa en anpassad färgpalett baserad på K-means.
- **Kvadratisk beskärning:** Inbyggd 1:1 beskärning av originalbilden via Cropper.js.
- **Avancerade reglage:** Justera RGB, Kontrast och Gamma för bästa konverteringsresultat.
- **Dithering:** Stöd för Floyd-Steinberg dithering.
- **PDF-utskrift:** Ladda ner mönstret i exakt skala för 5mm-pärlor (t.ex. Hama Midi) tillsammans med en automatisk "inköpslista".
- **Helt klientbaserad:** Inget sparas på någon server, all bildbehandling sker i webbläsaren.

## 🚀 Utveckling lokalt (Podman)
Projektet hanteras helt och hållet via Docker/Podman för att undvika problem med lokala Node-beroenden på värdmaskinen. Se `AGENTS.md` för strikta regler kring detta.

### Starta utvecklingsservern
Starta utvecklingsservern (Vite) på `http://localhost:5173`:
```bash
/opt/podman/bin/podman compose up
```

### Bygga för produktion
För att generera de statiska filerna som sedan kan köras överallt, kör:
```bash
docker compose run --rm app npm run build
```
Detta bygger produktionstillgångarna inuti `docs/`-mappen. Volymen skyddar värdmaskinen från att få utläckta `node_modules`.

## 🌐 Publicering till GitHub Pages
Eftersom produktionsbygget matar ut sina filer i `docs/` är det otroligt enkelt att publicera projektet till nätet.
1. Checka in koden på `main`-branchen till GitHub.
2. Gå till repots inställningar -> Pages.
3. Välj "Deploy from a branch", sätt branchen till `main` och välj `/docs`-mappen.
4. Spara, och appen är live! https://martinlubcke.github.io/peggy/
