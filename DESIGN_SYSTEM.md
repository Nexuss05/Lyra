# 🎨 Design System - Depth & Elevation

## Sistema di Shadow Implementato

Abbiamo creato un sistema di profondità coerente basato su **neomorphic design** con diversi livelli di elevazione.

### 📊 Shadow Levels

#### Level 0: Flat - No Shadow
```css
--shadow-0: none;
```
**Utilizzo:** Elementi disabled, ghost buttons

---

#### Level 1: Small Shadow - Subtle Elevation
```css
--shadow-1: 
  0 1px 2px rgba(0, 0, 0, 0.04),
  0 2px 4px rgba(0, 0, 0, 0.04);
```
**Utilizzo:** 
- Secondary buttons (outline variant)
- Search button nella sidebar
- Conversation items (non-active)
- Settings buttons
- Cards generici

**Componenti:**
- `Button variant="outline"`
- Sidebar search icon
- Conversation list items
- Settings/Theme toggle buttons

---

#### Level 2: Medium Shadow - Clear Elevation
```css
--shadow-2: 
  0 2px 4px rgba(0, 0, 0, 0.06),
  0 4px 8px rgba(0, 0, 0, 0.06),
  0 8px 16px rgba(0, 0, 0, 0.04);
```
**Utilizzo:**
- Primary buttons (default state)
- Avatar icons
- User message bubbles
- Sidebar container
- Hover state di elementi level 1

**Componenti:**
- `Button variant="default"` (state: default)
- ChatBubble avatars
- User messages
- Sidebar main container

---

#### Level 3: Large Shadow - Strong Elevation
```css
--shadow-3: 
  0 4px 8px rgba(0, 0, 0, 0.08),
  0 8px 16px rgba(0, 0, 0, 0.08),
  0 16px 32px rgba(0, 0, 0, 0.06);
```
**Utilizzo:**
- **Most important action buttons** (Send, Stop, New Chat)
- Welcome screen card
- Hover state di primary buttons

**Componenti:**
- Send/Stop button (ChatInput)
- New Chat button (Sidebar)
- WelcomeScreen main card

---

### 🔽 Inset Shadows - Pressed/Input States

#### Small Inset
```css
--shadow-inset-sm: inset 0 1px 2px rgba(0, 0, 0, 0.08);
```
**Utilizzo:**
- AI message bubbles
- Input fields generici
- Active conversation items
- Icon containers nella sidebar

**Componenti:**
- AI ChatBubbles
- `<Input />` component
- Active conversation (Sidebar)
- Settings icon containers

---

#### Medium Inset
```css
--shadow-inset-md: inset 0 2px 4px rgba(0, 0, 0, 0.1);
```
**Utilizzo:**
- Chat input textarea
- Form inputs with focus

**Componenti:**
- ChatInput textarea
- Form inputs

---

#### Large Inset
```css
--shadow-inset-lg: inset 0 3px 6px rgba(0, 0, 0, 0.12);
```
**Utilizzo:** Reserved per stati pressed molto pronunciati

---

## 🎯 Gerarchia di Importanza

### High Priority (Level 3)
- **Send/Stop Button** → Azione primaria più importante
- **New Chat Button** → Call-to-action principale
- **Welcome Card** → First impression

### Medium Priority (Level 2)  
- **Primary Buttons** → Azioni principali
- **User Messages** → Content dell'utente
- **Avatars** → Identità visiva
- **Sidebar Container** → Struttura principale

### Low Priority (Level 1)
- **Secondary Buttons** → Azioni secondarie
- **List Items** → Navigazione
- **Settings Controls** → Utility functions

### Inset (Input/Pressed States)
- **AI Messages** → Contenuto ricevuto
- **Input Fields** → Aree di inserimento
- **Active Items** → Stati selezionati

---

## 🎭 Interaction States

### Hover Effects
```css
/* Primary Buttons */
default: shadow-[var(--shadow-2)]
hover:   shadow-[var(--shadow-3)]
active:  shadow-[var(--shadow-1)]

/* Secondary Buttons */
default: shadow-[var(--shadow-1)]
hover:   shadow-[var(--shadow-2)]

/* Conversation Items */
default: shadow-[var(--shadow-1)]
hover:   shadow-[var(--shadow-2)]
```

### Disabled State
```css
disabled: shadow-none
disabled: opacity-50
```

---

## 🌓 Dark Mode

Le shadow vengono automaticamente adattate per dark mode con valori più intensi:

```css
.dark {
  --shadow-1: rgba(0, 0, 0, 0.3) /* più scuro */
  --shadow-2: rgba(0, 0, 0, 0.4)
  --shadow-3: rgba(0, 0, 0, 0.5)
  --shadow-inset-sm: rgba(0, 0, 0, 0.4)
  --shadow-inset-md: rgba(0, 0, 0, 0.5)
  --shadow-inset-lg: rgba(0, 0, 0, 0.6)
}
```

---

## 📦 Componenti Aggiornati

### ✅ ChatBubble
- Avatar: `shadow-[var(--shadow-2)]`
- User message: `shadow-[var(--shadow-2)]`
- AI message: `shadow-[var(--shadow-inset-sm)]` + border

### ✅ ChatInput
- Textarea: `shadow-[var(--shadow-inset-md)]`
- Send/Stop button: `shadow-[var(--shadow-3)]` con hover effects
- Regenerate button: `shadow-[var(--shadow-1)]`

### ✅ Sidebar
- Container: `shadow-[var(--shadow-2)]`
- New Chat button: `shadow-[var(--shadow-3)]`
- Search button: `shadow-[var(--shadow-1)]`
- Conversation items: `shadow-[var(--shadow-1)]` con hover
- Active conversation: `shadow-[var(--shadow-inset-sm)]`
- Settings buttons: `shadow-[var(--shadow-1)]`
- Icon containers: `shadow-[var(--shadow-inset-sm)]`

### ✅ Button Component (ui/button.tsx)
- **variant="default"**: shadow-2 → hover:shadow-3 → active:shadow-1
- **variant="destructive"**: shadow-2 → hover:shadow-3
- **variant="outline"**: shadow-1 → hover:shadow-2
- **variant="secondary"**: inset-sm → hover:shadow-1
- **variant="ghost"**: no shadow
- **disabled state**: shadow-none

### ✅ Card Component
- Default: `shadow-[var(--shadow-1)]`

### ✅ Input Component
- Default: `shadow-[var(--shadow-inset-sm)]`

---

## 🎨 Best Practices

1. **Elevazione = Importanza**: Più alta la shadow, più importante l'elemento
2. **Inset = Input/Contenuto**: Gli elementi che ricevono contenuto hanno inset shadows
3. **Hover aumenta elevazione**: Gli elementi interattivi "si sollevano" all'hover
4. **Active riduce elevazione**: Click simula una pressione fisica
5. **Disabled = Flat**: Elementi disabilitati non hanno profondità
6. **Coerenza**: Usa sempre le variabili CSS, non valori custom

---

## 🚀 Come Usare

```tsx
// Level 3 - Most important action
<button className="shadow-[var(--shadow-3)] hover:shadow-[var(--shadow-2)]">
  Primary Action
</button>

// Level 2 - Important elements
<div className="shadow-[var(--shadow-2)]">
  Important content
</div>

// Level 1 - Secondary elements
<button className="shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)]">
  Secondary Action
</button>

// Inset - Input fields
<input className="shadow-[var(--shadow-inset-md)]" />

// Inset small - Pressed/received content
<div className="shadow-[var(--shadow-inset-sm)]">
  AI Response
</div>
```

---

**Creato il:** 25 Ottobre 2025  
**Sistema:** Neomorphic Design con 4 livelli di elevazione + 3 livelli inset  
**Compatibilità:** Light/Dark mode automatic
