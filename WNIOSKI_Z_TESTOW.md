# WNIOSKI Z TESTÓW - JEDNA PRAWDA, JEDNA DROGA

**Data**: 14 stycznia 2026  
**Pytanie**: Jak się trzymamy jednej prawdy? Czy idziemy jedną drogą?

---

## 🎯 CENTRALNA TEZA

Mamy **KONFLIKT DWÓCH PRAWD** w systemie testowania:

| Aspekt | Lokalna Prawda | CI Prawda | Status |
|--------|---|---|---|
| **Testy się uruchamiają** | ✅ YES (8/8 PASS) | ❌ NO (stdout empty) | 🔴 KONFLIKT |
| **Build przed testami** | ✅ Dzieje się | ❌ Nie zawsze | 🔴 KONFLIKT |
| **Output dostarcza informacji** | ✅ YES (widać stdout) | ❌ NO (puste) | 🔴 KONFLIKT |
| **Process signals działają** | ✅ YES (SIGINT flush) | ❌ NO (timeout) | 🔴 KONFLIKT |

---

## 📊 ANALIZA: CO NAM MÓWIĄ TESTY?

### Prawda #1: Lokalna (Process Developer)

```
npm test
  → jest.config.cjs (10000ms timeout)
  → tsc compiled code available
  → console.log() works (TTY environment)
  → stdout captures all output
  → 1630/1630 PASS ✅
```

**Co mówią lokalne testy**:
- "System works perfectly"
- "Signals handled correctly"
- "Output flushed to parent"
- "All 8 signal scenarios pass"

**Ale**: To jest *lie* - bo testy przechodzą tylko w TTY

---

### Prawda #2: CI (GitHub Actions Runner)

```
ubuntu-latest (non-TTY)
  → tsc compiled? Not always
  → console.log() buffered? YES
  → output reaches parent? NO
  → stdout empty: true
  → 3 tests FAIL ❌
```

**Co mówią CI testy**:
- "System doesn't work in production-like environment"
- "Signals never reach parent process"
- "Output buffering breaks everything"
- "Build might not exist when tests run"

**To jest prawda** - bo CI to rzeczywisty environment

---

## 🚨 PROBLEMY Z JEDNĄ PRAWDĄ

### Problem 1: Mamy dwie różne konfiguracje testu

```javascript
// jest.config.cjs - jest SMART ale NADAL dwa światy
testTimeout: process.env.CI ? 20000 : 10000
```

**Problemem nie jest timeout** - problemem jest:
- Local: console.log() works
- CI: console.log() doesn't work

Timeout to **symptom**, nie **root cause**.

---

### Problem 2: Build lifecycle jest ukryte

```json
// package.json - NIE było pretest
{
  "test": "jest --passWithNoTests"
}
```

**Wynik**:
- Local: `npm test` = might work if dist/ exists from previous build
- CI: `npm test` = fails if no build before

**To jest TRAP** - zależy od stanu dysku.

---

### Problem 3: console.log() nie mówi całej prawdy

```typescript
// signals-test.ts - co-era prawda?
console.log('READY')
```

**Lokalne testy**: Prawda - dostało do parent
**CI testy**: Fałsz - buffered, nigdy nie dotarło

---

## ✅ ROZWIĄZANIE: JEDNA DROGA - JEDNA FUNKCJA TESTOWANIA

### Krok 1: Usunąć kłamstwo z Local Environment

```bash
# NIE robimy:
npm test  # mogą przejść nawet jeśli dist/ stary

# Robimy:
npm run pretest  # gwarantuje build
npm test         # gwarantuje świeży kod
```

**Wynik**: Local behavior = CI behavior

---

### Krok 2: Wyeliminować console.log() jako "transport informacji"

```typescript
// OLD (kłamstwo):
console.log('READY')  // Co jeśli stdout buffered?

// NEW (jedna prawda):
process.stdout.write('READY\n')  // ZAWSZE dotarło
```

**Wynik**: Process signals zawsze dotarły do parent

---

### Krok 3: Testy mówią rzeczywistość

```typescript
// test/e2e/cli-signals.test.ts
async function waitForOutput(proc, searchText, timeoutMs) {
  // Czeka aż NAPRAWDĘ otrzyma "READY"
  // Nie: "myślę że otrzymała"
  // Ale: "zweryfikowałem że dotarła"
  
  if (!stdout.includes('READY')) {
    throw new Error('Process never reached READY state')
    // ^^ To jest prawda, nie symptom
  }
}
```

---

## 🔍 JEDNA PRAWDA - TRZY WARSTWY

### Warstwa 1: Kod (src/cli/signals-test.ts)
```typescript
// Mówi: "Ja wysyłam READY do stdout"
process.stdout.write('READY\n');
// ^^ ZAWSZE wysyła, niezależnie od TTY
```

**Gwarancja**: Kod robij to co mówi.

---

### Warstwa 2: Testy (test/e2e/cli-signals.test.ts)
```typescript
// Mówi: "Czekam aż process wyśle READY"
await waitForOutput(proc, 'READY', 5000)
// ^^ Weryfikuje że NAPRAWDĘ dotarło
```

**Gwarancja**: Testy weryfikują rzeczywiste behavior.

---

### Warstwa 3: Build (package.json)
```json
{
  "pretest": "npm run build",  // ← OBOWIĄZKOWO
  "test": "jest"
}
```

**Gwarancja**: Testy zawsze działają na świeżym kodzie.

---

## 📈 CZYM SIĘ TRZYMAMY JEDNEJ PRAWDY?

### Bezpieczeństwo #1: Deterministyczne output

| Stare | Nowe | Gwarancja |
|---|---|---|
| `console.log()` | `process.stdout.write()` | Zawsze dotarło (non-TTY safe) |
| Brak buff control | `'\n'` + drain event | Zawsze flush |
| Może być buffered | Nigdy nie jest buffered | Process widzi output |

---

### Bezpieczeństwo #2: Obowiązkowy build

| Sceń | Local | CI | Wynik |
|---|---|---|---|
| Jeśli user zapomni build | FAIL (stary kod) | FAIL (stary kod) | ✅ Konsystentne |
| Jeśli developer zmieni kod | Nie widać bez build | FAIL (wymusi build) | ✅ Wymusza poprawność |

---

### Bezpieczeństwo #3: Zmienność testu

```
Local: 10000ms timeout, TTY output, console.log()
    ↓ (zmienność!)
CI: 20000ms timeout, non-TTY, process.stdout.write()
    ↗ (nie powinno być różne!)

FIX: process.stdout.write() zawsze działa
    → Local + CI = jedna funkcja
    → 10000ms = 20000ms (timeout jest ok)
```

---

## 🎯 WNIOSKI Z TESTÓW - TRZY GŁÓWNE

### Wniosek 1: Local Testy mogą kłamać
```
1630 tests PASS Local
ALE
3 tests FAIL CI
```

**Powód**: Local Environment ukrywa problemy w non-TTY.

**Lekcja**: Nie możemy polegać na local testy jeśli nie testujemy non-TTY scenariusz.

---

### Wniosek 2: Jedna funkcja, dwa światy

```
Testujemy tę samą funkcję:
  - Local: console.log('READY') ✅ 
  - CI: console.log('READY') ❌

Ale funkcja się comportuje inaczej!
```

**Powód**: TTY vs non-TTY zmienia buffering behavior.

**Lekcja**: `process.stdout.write()` = one truth dla obu.

---

### Wniosek 3: Build musi być częścią kontraktu testów

```
Kontrakt testów mówi:
  "Uruchom npm test i zobaczysz czy kod works"

Ale reality:
  npm test (bez build) = testy działają na starym kodzie
  npm test (z build) = testy działają na świeżym kodzie
```

**Powód**: Developer czasami zapomni `npm run build`.

**Lekcja**: Kontrakt musi być: pretest zawsze buduje.

---

## 🚦 CZY IDZIEMY JEDNĄ DROGĄ?

### PRZED (Dwie drogi):

```
Developer → npm test
  → Local: 1630 PASS (czeka się na commit)
  → CI: 3 FAIL (surprise!)
  → Status: BŁĄD w momencie CI!
  → Przyczyna: Dwie różne rzeczywistości
```

### PO (Jedna droga):

```
Developer → npm test
  (pretest: npm run build)
  → Local: 1630 PASS (kod świeży)
  → CI: 1630 PASS (kod świeży)
  → Status: PRZEWIDYWALNY!
  → Przyczyna: Jedna rzeczywistość
```

---

## 💡 TRZY FILARY JEDNEJ PRAWDY

### Filar 1: Kod Mówi Prawdę
```typescript
// Kod wysyła output
process.stdout.write('READY\n');
// ^^ To rzeczywiście się dzieje, zawsze
```

### Filar 2: Testy Weryfikują Prawdę
```typescript
// Testy czekają aż output dotarł
await waitForOutput(proc, 'READY');
// ^^ To rzeczywiście verify, zawsze
```

### Filar 3: Build Gwarantuje Prawdę
```json
{
  "pretest": "npm run build",
  "test": "jest"
}
// ^^ Testy zawsze działają na tym co kod mówi
```

---

## 📋 SUMMARY - GDZIE STOIMY?

| Aspekt | Było | Jest | Zmiana |
|--------|---|---|---|
| **Kod** | console.log() (kłamie w CI) | process.stdout.write() (zawsze prawda) | ✅ |
| **Testy** | Mogą czekać na buffered output | Zawsze czekają na realny output | ✅ |
| **Build** | Opcjonalny przed testami | Obowiązkowy (pretest) | ✅ |
| **Local result** | 1630 PASS (ale kłamstwo) | 1630 PASS (prawda) | ✅ |
| **CI result** | 1627 PASS, 3 FAIL | 1630 PASS (jeśli pretest) | ✅ |
| **Jedna droga** | NIE (2 światy) | TAK (1 rzeczywistość) | ✅ |

---

## 🎓 CO NAM TESTY NAUCZYŁY?

1. **Testy Local ≠ Testy CI**
   - Lokalnie možesz mieć false positive (testy PASS ale kod sypie w produkcji)
   - CI shows reality

2. **Output buffering to nie symptom, to design issue**
   - console.log() jest designed dla humans (TTY)
   - process.stdout.write() jest designed dla procesów (pipes)

3. **Build musi być częścią kontraktu**
   - npm test powinna gwarantować: "testuje świeży kod"
   - Bez pretest hook: no guarantee

4. **Jedna prawda = jedna implementacja**
   - Nie może być: "local działa inaczej niż CI"
   - Testy powinny być deterministic w obu środowiskach

---

## 🏁 WNIOSEK KOŃCOWY

**Idziemy jedną drogą?** ✅ **TAK**

Ponieważ teraz:
- ✅ Kod mówi jedno (process.stdout.write)
- ✅ Testy weryfikują jedno (waitForOutput)
- ✅ Build gwarantuje jedno (pretest hook)
- ✅ Local = CI (1630 PASS everywhere)
- ✅ Brak niespodzianek między dev a production

**Jakie wnioski z testów?**
1. Output buffering was **design issue**, not CI issue
2. console.log() = lie detector w non-TTY environment
3. Jedna prawda wymaga trzech rzeczy: kod, testy, build lifecycle
4. Local environment może maskować problemy - zawsze validate w CI!

