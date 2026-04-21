# AGENTS.md

## Regler för AI-agenter i detta projekt
* **NPM & Node:** Kör **aldrig** `npm`, `node` eller liknande kommandon direkt på värdmaskinen. Alla Node-relaterade kommandon måste köras inuti Docker/Podman.
* **Podman Compose:** Använd `/opt/podman/bin/podman-compose` för att bygga eller köra containrar, eftersom projektet är uppsatt med en `docker-compose.yml` som isolerar `node_modules` i en anonym volym. Detta förhindrar att beroenden läcker ut i värdmaskinens katalog.

För att bygga frontend-koden (eller köra npm-kommandon engångs), kör:
`/opt/podman/bin/podman compose run --rm app sh -c "npm install && npm run build"`
