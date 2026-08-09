"use client";

import { useEffect } from "react";
import { actions, getState, useStore, viewportSizeRef } from "./store";

export function useKeyboardShortcuts() {
  const project = useStore((s) => s.project);
  const ui = useStore((s) => s.ui);
  const camera = useStore((s) => s.camera);

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
      if (ctrl && (mod("f") || mod("k"))) {
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
      if (ctrl && mod("backspace")) {
        e.preventDefault();
        if (ui.selectedNodeIds.length) actions.deleteNodes(ui.selectedNodeIds);
        else if (ui.selectedEdgeIds.length) actions.deleteEdges(ui.selectedEdgeIds);
        return;
      }
      if (ctrl && mod("l") && ui.selectedNodeIds.length > 1) {
        e.preventDefault();
        actions.linkNodes(ui.selectedNodeIds);
        return;
      }

      if (e.key === "Escape") {
        if (ui.searchOpen) actions.setSearch(false);
        else if (ui.commandPaletteOpen) actions.setCommandPalette(false);
        else if (ui.inspectorOpen) actions.setInspector(false);
        else if (ui.presentation.active) actions.stopPresentation();
        else if (ui.connectFromId || ui.connectAwaitFirst) actions.cancelConnect();
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

      if (e.key === "Enter" && !e.shiftKey && ui.selectedNodeIds.length) {
        e.preventDefault();
        const ids = ui.selectedNodeIds;
        const lastId = ids[ids.length - 1];
        const last = project.nodes[lastId];
        if (!last) return;
        const id = actions.createNodeAt(last.x, last.y + last.h + 80, {});
        actions.createEdgeFromTo(lastId, id);
        return;
      }

      if (mod("n")) {
        e.preventDefault();
        const s = getState();
        const vw = viewportSizeRef.current.w;
        const vh = viewportSizeRef.current.h;
        const cwx = (vw / 2 - s.camera.x) / Math.max(0.01, s.camera.zoom);
        const cwy = (vh / 2 - s.camera.y) / Math.max(0.01, s.camera.zoom);
        actions.createNodeAt(cwx, cwy);
        return;
      }

      if (mod("h")) actions.resetCamera();
      if (e.key === "1") actions.setZoom(1);
      if (e.key === "=" || e.key === "+") {
        const v = viewportSizeRef.current;
        actions.zoomAt(v.w / 2, v.h / 2, camera.zoom * 1.2, v);
      }
      if (e.key === "-" || e.key === "_") {
        const v = viewportSizeRef.current;
        actions.zoomAt(v.w / 2, v.h / 2, camera.zoom / 1.2, v);
      }
      if (e.key === "[") actions.leaveToParentWorld?.();
      if (e.key === "]" && ui.selectedNodeIds.length) {
        const n = project.nodes[ui.selectedNodeIds[0]];
        if (n?.isWorld && n.childWorldId) actions.enterWorld(n.childWorldId);
      }
      if (mod("b")) {
        const n = ui.selectedNodeIds[0];
        if (n) actions.toggleNode(n, "pinned");
      }
      if (!ctrl && mod("l")) {
        const n = ui.selectedNodeIds[0];
        if (n) actions.toggleNode(n, "locked");
      }
      if (mod("f")) actions.fitSelection();

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
  }, [project, ui, camera]);
}
