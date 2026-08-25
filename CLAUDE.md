# Anweisungsdokument für Claude-Code-Prompts

**Zweck:** Dauerhafte Regel für alle Prompts an meine Claude-Code-Sitzung. Gehört als
feste Projekt-Anweisung hinterlegt (`CLAUDE.md`), nicht in jeden einzelnen
Feature-Prompt kopiert.

## 1. Grundprinzip: Kleine, kontrollierte Schritte

Weniger Umfang pro Ausführung, nicht weniger Präzision.

Workflow-Prinzip: Ich beschreibe präzise das gewünschte Produktverhalten und die
Constraints (das „Was") – auch als vollständiger Zielzustand eines größeren Features.
Claude Code leitet daraus anhand des tatsächlichen Codes die technisch sinnvollen,
kleinen Implementierungsschritte ab (das „Wie"). Ich muss die technische Aufteilung
nicht selbst vorgeben.

## 2. Claude Code darf und soll widersprechen

Claude Code hat direkten Einblick in den tatsächlichen, aktuellen Code – ich sehe nur,
was ich selbst weiß oder in einer möglicherweise veralteten Kopie steht. Ein
vorgeschlagener Plan ist ein fundierter Ausgangspunkt, keine bindende Anweisung. Sieht
Claude Code beim Lesen des echten Codes einen technischen Grund für einen anderen
Ansatz, soll das explizit benannt und eine Alternative vorgeschlagen werden, statt dem
Plan blind zu folgen. Gilt auch für erkannte Bugs oder Fehleinschätzungen im Plan
selbst.

## 3. Aufbau jedes einzelnen Arbeitsschritts

- **Kontext:** Nur was für diesen Schritt nötig ist.
- **Ziel:** In 1–3 Sätzen, was danach funktionieren soll.
- **Anforderungen:** Gewünschtes Verhalten, Edge Cases, was bestehen bleibt, was nicht
  angefasst wird.
- **Scope-Grenze:** Nur die beschriebene Änderung umsetzen, keine ungefragten
  Refactorings.
- **Vorgehen bei größeren Änderungen:** Relevante Dateien lesen, Plan nennen (inkl.
  etwaiger Einwände nach Punkt 2), auf Freigabe warten. Bei kleinen, isolierten
  Änderungen kann die Planungsphase entfallen.
- **Umsetzung:** Nach Freigabe nur diesen Schritt umsetzen, bestehende
  Komponenten/Patterns nutzen.
- **Prüfung:** Kleinsten sinnvollen Check wählen, nicht bei jeder Kleinigkeit einen
  vollständigen Build erzwingen. Vollständiger Build/Lint spätestens am Ende eines
  Feature-Blocks.
- **Umgang mit bestehenden Fehlern:** Primär eigene Fehler beheben. Bestehende Probleme
  nicht ungefragt ändern; falls blockierend, benennen und Rücksprache halten.
- **Abschluss-Bericht:** Was wurde geändert? Welche Dateien? Welche Checks, Ergebnis?
  Abweichung vom Plan, und warum? Offene Probleme? Danach stoppen und auf nächste
  Anweisung warten.

## 4. Große Features aufteilen

Die Aufteilung eines größeren Feature-Wunsches in einzelne Arbeitspakete schlägt Claude
Code selbst vor, anhand der tatsächlichen Code-Struktur und Abhängigkeiten.
Arbeitspakete so wählen, dass sie möglichst unabhängig implementierbar und sinnvoll
prüfbar sind. Abhängige Änderungen in technisch sinnvoller Reihenfolge durchführen.
Jedes Paket: implementieren → gezielt prüfen → stoppen. Nach Abschluss aller Pakete
eines Features: vollständiger Build/Lint/Regressionscheck.

## 5. Kontext effizient halten

Nur für den aktuellen Schritt relevante Dateien lesen. Bereits gelesene, unveränderte
Dateien nicht ohne Grund erneut vollständig analysieren. Bei stark angewachsenem
Kontext oder sinkender Geschwindigkeit: nach einem stabilen Commit einen kompakten
Übergabestand erstellen, neue Session für den nächsten Feature-Block beginnen. Keine
starre Prozent-Grenze.

Der Übergabestand enthält ausschließlich: aktueller Branch/Commit, bereits
fertiggestellte relevante Änderungen, noch offene Anforderungen, wichtige
Architekturentscheidungen, bekannte Probleme. Keine vollständige Nacherzählung der
bisherigen Session.

## 6. Git-Verhalten

Nicht nach jedem winzigen Edit committen. Standardmäßig nach einem abgeschlossenen,
vollständig geprüften Feature committen. Ein sauberer Zwischen-Commit ist erlaubt, wenn
ein logisch abgeschlossener und geprüfter Arbeitsschritt einen sinnvollen Checkpoint
bildet – insbesondere vor einem Session-Wechsel. Immer auf dem Feature-Branch. Nicht auf
`main` wechseln oder mergen ohne ausdrückliche Freigabe.

## 7. Terminal und Sicherheit (Anfänger-Kontext)

Verändernde, destruktive oder deployment-relevante Befehle vorher erklären, auf
Freigabe warten, außer bereits freigegeben. Normale Lese-, Such-, Build-, Lint-Befehle
ohne Einzelrückfrage.

## 8. Prioritäten-Reihenfolge

1. Korrektheit
2. Keine Regressionen
3. Technisch sinnvoller Ansatz (auch abweichend vom Plan, siehe Punkt 2)
4. Kleine, kontrollierbare Änderungen
5. Wiederverwendung bestehender Architektur
6. Kurze Feedback-Zyklen, effiziente Kontextnutzung
7. Keine unnötigen Refactorings
8. Optimierung/Polishing erst danach

## Gelernte Lektionen

- Secrets nie im Chat/Screenshot teilen (auch nicht abgeschnitten).
- `wrangler secret put` muss in einem echten, interaktiven Terminal laufen, nicht über
  nicht-interaktive Tool-Aufrufe.
- Bei Verwechslungsgefahr zwischen Frontend-`.env`-Wert und Worker-Secret: per
  Shell-Variable beide gleichzeitig setzen (`SECRET=$(openssl rand -hex 32)`), nie
  manuell doppelt kopieren.
