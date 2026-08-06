"use client";

import { useEffect } from "react";
import { actions, useStore } from "./store";

export function useKeyboardShortcuts() {
  const project = useStore((s) => s.project);
  const ui = useStore((s) => s.ui);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      const tag = tgt?.tagName;
      const isEditing =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tgt?.isContentEditable;
      const ctrl = e.ctrlKey || e.metaKey;
      const mod = (k: string) => e.key.toLowerCase() === k;

      if (ctrl && mod("s")) {
        e.preventDefault();
        actions.saveNow();
        return;
      }
      if (ctrl && !e.shiftKey && mod("z")) {
        e.preventDefault();
        actions.undo();
        return;
      }
      if ((ctrl && e.shiftKey && mod("z")) || (ctrl && mod("y"))) {
        e.preventDefault();
        actions.redo();
        return;
      }
      if (ctrl && mod("f")) {
        e.preventDefault();
        actions.setSearch(true, "");
        return;
      }
      if (ctrl && mod("k")) {
        e.preventDefault();
        actions.setSearch(true, "");
        return;
      }
      if (ctrl && mod("p")) {
        e.preventDefault();
        actions.setCommandPalette(true);
        return;
      }
      if (ctrl && mod("g")) {
        e.preventDefault();
        actions.layoutAuto();
        return;
      }
      if (ctrl && mod("d")) {
        e.preventDefault();
        actions.duplicateNodes(ui.selectedNodeIds);
        return;
      }
      if (e.key === "Escape") {
        if (ui.searchOpen) actions.setSearch(false);
        else if (ui.commandPaletteOpen) actions.setCommandPalette(false);
        else if (ui.inspectorOpen) actions.setInspector(false);
        else if (ui.presentation.active) actions.stopPresentation();
        else actions.clearSelection();
        return;
      }
      if (isEditing) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (ui.selectedNodeIds.length) {
          e.preventDefault();
          actions.deleteNodes(ui.selectedNodeIds);
          return;
        }
        if (ui.selectedEdgeIds.length) {
          e.preventDefault();
          actions.deleteEdges(ui.selectedEdgeIds);
          return;
        }
      }
      if (ctrl && mod("a")) {
        e.preventDefault();
        const all = Object.values(project.nodes)
          .filter((n) => n.worldId === project.currentWorldId)
          .map((n) => n.id);
        actions.selectNode(all);
        return;
      }
      if (e.key === " " && !isEditing) {
        // space pan handled in canvas on keydown
      }
      if (e.key === "Tab" && ui.selectedNodeIds.length) {
        e.preventDefault();
        const ids = ui.selectedNodeIds;
        const n = project.nodes[ids[0]];
        if (!n) return;
        const id = actions.createNodeAt(
          n.x + n.w + 240,
          n.y + (e.shiftKey ? -120 : 120),
          {},
        );
        actions.createEdgeFromTo(ids[0], id);
        return;
      }
      if (e.key === "Enter" && ui.selectedNodeIds.length) {
        if (e.shiftKey) return;
        e.preventDefault();
        const ids = ui.selectedNodeIds;
        const n = project.nodes[ids[0]];
        if (!n) return;
        actions.createNodeAt(n.x, n.y + n.h + 80, {});
        return;
      }
      if (e.key === "h" || e.key === "H") actions.resetCamera();
      if (e.key === "1") actions.setZoom(1);
      if (e.key === "=" || e.key === "+")
        actions.setZoom(useStore as unknown as number);
      if (e.key === "[") actions.leaveToParentWorld?.();
      if (mod("b")) {
        const n = ui.selectedNodeIds[0];
        if (n) actions.toggleNode(n, "pinned");
      }
      if (mod("l")) {
        const n = ui.selectedNodeIds[0];
        if (n) actions.toggleNode(n, "locked");
      }
      if (mod("f")) {
        actions.fitSelection();
      }
      if (e.shiftKey && ui.presentation.active) {
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          actions.stepPresentation(-1);
        }
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          actions.stepPresentation(1);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, ui]);
}
