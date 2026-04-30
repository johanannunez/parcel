"use client";

import { useEffect, useRef, useState } from "react";

const ENTRIES = [
  { name: "George Washington", email: "george@washington.land" },
  { name: "Henry Flagler",     email: "henry@flagler.estate" },
  { name: "Hetty Green",       email: "hetty@green.estate" },
  { name: "John Jacob Astor",  email: "john@astor.properties" },
  { name: "William Levitt",    email: "william@levitt.homes" },
  { name: "Daniel Burnham",    email: "daniel@burnham.build" },
  { name: "Frederick Olmsted", email: "fred@olmsted.land" },
];

const TYPE_MS   = 52;
const DELETE_MS = 24;
const HOLD_MS   = 2200;
const GAP_MS    = 380;

export function useTypewriterPlaceholder() {
  const [emailDisplay, setEmailDisplay] = useState("");
  const [entryIdx, setEntryIdx] = useState(0);
  const focusedRef = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let idx = 0;
    let charIdx = 0;
    type Phase = "typing" | "hold" | "deleting" | "gap";
    let phase: Phase = "typing";

    function tick() {
      if (focusedRef.current) {
        timer = setTimeout(tick, 80);
        return;
      }

      const word = ENTRIES[idx].email;

      switch (phase) {
        case "typing":
          charIdx++;
          setEmailDisplay(word.slice(0, charIdx));
          if (charIdx >= word.length) {
            phase = "hold";
            timer = setTimeout(tick, HOLD_MS);
          } else {
            timer = setTimeout(tick, TYPE_MS);
          }
          break;

        case "hold":
          phase = "deleting";
          timer = setTimeout(tick, DELETE_MS);
          break;

        case "deleting":
          charIdx--;
          setEmailDisplay(word.slice(0, charIdx));
          if (charIdx <= 0) {
            idx = (idx + 1) % ENTRIES.length;
            setEntryIdx(idx);
            charIdx = 0;
            phase = "gap";
            timer = setTimeout(tick, GAP_MS);
          } else {
            timer = setTimeout(tick, DELETE_MS);
          }
          break;

        case "gap":
          phase = "typing";
          timer = setTimeout(tick, TYPE_MS);
          break;
      }
    }

    timer = setTimeout(tick, 800);
    return () => clearTimeout(timer);
  }, []);

  return {
    namePlaceholder: emailDisplay.length > 0 ? ENTRIES[entryIdx].name : "",
    emailPlaceholder: emailDisplay,
    onFocus: () => { focusedRef.current = true; },
    onBlur:  () => { focusedRef.current = false; },
  };
}

const PASSWORD_ENTRIES = [
  "p@$$w0rd!",
  "Secure*123",
  "Tr0phy#99!",
  "M@ng0_K3y",
  "Blu3*Sky!2",
  "#N3stl3d!",
  "W!nt3r@22",
  "X!23mKr7*",
];

const PWD_TYPE_MS   = 48;
const PWD_DELETE_MS = 20;
const PWD_HOLD_MS   = 1800;
const PWD_GAP_MS    = 320;

export function usePasswordPlaceholder() {
  const [display, setDisplay] = useState("");
  const focusedRef = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let idx = 0;
    let charIdx = 0;
    type Phase = "typing" | "hold" | "deleting" | "gap";
    let phase: Phase = "gap";

    function tick() {
      if (focusedRef.current) {
        timer = setTimeout(tick, 80);
        return;
      }

      const word = PASSWORD_ENTRIES[idx];

      switch (phase) {
        case "typing":
          charIdx++;
          setDisplay(word.slice(0, charIdx));
          if (charIdx >= word.length) {
            phase = "hold";
            timer = setTimeout(tick, PWD_HOLD_MS);
          } else {
            timer = setTimeout(tick, PWD_TYPE_MS);
          }
          break;

        case "hold":
          phase = "deleting";
          timer = setTimeout(tick, PWD_DELETE_MS);
          break;

        case "deleting":
          charIdx--;
          setDisplay(word.slice(0, charIdx));
          if (charIdx <= 0) {
            idx = (idx + 1) % PASSWORD_ENTRIES.length;
            charIdx = 0;
            phase = "gap";
            timer = setTimeout(tick, PWD_GAP_MS);
          } else {
            timer = setTimeout(tick, PWD_DELETE_MS);
          }
          break;

        case "gap":
          phase = "typing";
          timer = setTimeout(tick, PWD_TYPE_MS);
          break;
      }
    }

    timer = setTimeout(tick, 1400);
    return () => clearTimeout(timer);
  }, []);

  return {
    passwordPlaceholder: display,
    onPasswordFocus: () => { focusedRef.current = true; },
    onPasswordBlur:  () => { focusedRef.current = false; },
  };
}
