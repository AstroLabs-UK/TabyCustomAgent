#!/usr/bin/env python3
"""
One-command launcher for Custom Taby Agent (Tauri + Vite).

Usage (from repo root):
  python run_tabycustomagent.py              # dev (default)
  python run_tabycustomagent.py dev
  python run_tabycustomagent.py build        # release installer / exe
  python run_tabycustomagent.py check        # deps only
  python run_tabycustomagent.py --skip-install dev

Handles common Windows pitfalls:
  - PowerShell npm.ps1 execution policy (uses npm.cmd / node directly)
  - Paths with spaces under Program Files
  - link.exe not on PATH (locates MSVC via vswhere and prepends PATH)
  - Missing node_modules, cargo, or C++ workload (clear messages)
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
IS_WIN = os.name == "nt"


class CheckError(Exception):
    def __init__(self, title: str, details: str, fix: str | None = None):
        self.title = title
        self.details = details
        self.fix = fix
        super().__init__(title)


def which(name: str) -> str | None:
    return shutil.which(name)


def run(
    cmd: list[str],
    *,
    cwd: Path | None = None,
    env: dict | None = None,
) -> int:
    print(f"\n> {' '.join(cmd)}\n", flush=True)
    try:
        return subprocess.call(cmd, cwd=str(cwd or ROOT), env=env)
    except FileNotFoundError as e:
        raise CheckError(
            "Command not found",
            str(e),
            "Install the missing tool and ensure it is on PATH.",
        ) from e


def find_node() -> str:
    node = which("node")
    if node:
        return node
    if IS_WIN:
        for candidate in (
            Path(os.environ.get("PROGRAMFILES", r"C:\Program Files"))
            / "nodejs"
            / "node.exe",
            Path(os.environ.get("PROGRAMFILES(X86)", r"C:\Program Files (x86)"))
            / "nodejs"
            / "node.exe",
            Path(os.environ.get("LOCALAPPDATA", ""))
            / "Programs"
            / "nodejs"
            / "node.exe",
        ):
            if candidate.is_file():
                return str(candidate)
    raise CheckError(
        "Node.js not found",
        "The `node` command is not on PATH.",
        "Install Node.js 20+ LTS from https://nodejs.org/ and reopen the terminal.",
    )


def find_npm_cmd() -> str | None:
    """Prefer npm.cmd on Windows to avoid PowerShell execution-policy blocks."""
    if IS_WIN:
        npm_cmd = which("npm.cmd")
        if npm_cmd:
            return npm_cmd
        node = find_node()
        sibling = Path(node).with_name("npm.cmd")
        if sibling.is_file():
            return str(sibling)
    return which("npm")


def find_cargo() -> str:
    cargo = which("cargo")
    if cargo:
        return cargo
    if IS_WIN:
        home = Path.home()
        for candidate in (
            home / ".cargo" / "bin" / "cargo.exe",
            Path(os.environ.get("USERPROFILE", "")) / ".cargo" / "bin" / "cargo.exe",
        ):
            if candidate.is_file():
                return str(candidate)
    raise CheckError(
        "Rust / cargo not found",
        "Tauri needs the Rust toolchain (`cargo`).",
        "Install from https://rustup.rs/ or: winget install Rustlang.Rustup\n"
        "Then open a NEW terminal and run: rustup default stable",
    )


def find_vs_install_path() -> Path | None:
    if not IS_WIN:
        return None
    vswhere = (
        Path(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)"))
        / "Microsoft Visual Studio"
        / "Installer"
        / "vswhere.exe"
    )
    if not vswhere.is_file():
        return None

    queries = [
        [
            str(vswhere),
            "-latest",
            "-products",
            "*",
            "-requires",
            "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
            "-property",
            "installationPath",
        ],
        [
            str(vswhere),
            "-latest",
            "-products",
            "*",
            "-property",
            "installationPath",
        ],
    ]
    for cmd in queries:
        try:
            out = subprocess.check_output(
                cmd, text=True, stderr=subprocess.DEVNULL
            ).strip()
            if out:
                return Path(out)
        except (subprocess.CalledProcessError, OSError):
            continue
    return None


def find_link_exe() -> Path | None:
    """Return link.exe if on PATH or under a VS / Build Tools install."""
    on_path = which("link")
    if on_path:
        return Path(on_path)

    vs = find_vs_install_path()
    if not vs:
        return None

    msvc_root = vs / "VC" / "Tools" / "MSVC"
    if not msvc_root.is_dir():
        return None

    versions = sorted((p for p in msvc_root.iterdir() if p.is_dir()), reverse=True)
    for ver in versions:
        for rel in (
            Path("bin") / "Hostx64" / "x64" / "link.exe",
            Path("bin") / "Hostx86" / "x64" / "link.exe",
            Path("bin") / "Hostx64" / "x86" / "link.exe",
        ):
            candidate = ver / rel
            if candidate.is_file():
                return candidate
    return None


def check_msvc_linker() -> Path | None:
    """Ensure MSVC linker exists; return path to link.exe or raise."""
    if not IS_WIN:
        return None

    link = find_link_exe()
    if link:
        if not which("link"):
            print(
                f"note: link.exe is not on PATH; will use:\n      {link}\n",
                flush=True,
            )
        return link

    raise CheckError(
        "MSVC linker (link.exe) not found",
        "Build Tools may be installed without the C++ workload.\n"
        "Rust on Windows needs the Visual C++ toolchain to produce an .exe.",
        "Modify the existing install (winget will not re-add workloads):\n\n"
        "  1. Start menu -> open Visual Studio Installer\n"
        "  2. On Build Tools 2022 click Modify\n"
        "  3. Check Desktop development with C++\n"
        "  4. Click Modify / Install and wait until finished\n"
        "  5. Close ALL terminals, open a new one, retry\n\n"
        "Or Admin PowerShell (adjust install path if needed):\n\n"
        r'  $setup = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\setup.exe"'
        "\n"
        r'  $ip = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools"'
        "\n"
        "  & $setup modify --installPath $ip "
        "--add Microsoft.VisualStudio.Workload.VCTools --quiet --wait\n\n"
        "GUI: https://visualstudio.microsoft.com/visual-cpp-build-tools/",
    )


def ensure_node_modules(node: str, npm: str | None, skip_install: bool) -> None:
    marker = ROOT / "node_modules" / "@tauri-apps" / "cli"
    if marker.is_dir():
        return
    if skip_install:
        raise CheckError(
            "Dependencies missing",
            f"Expected {marker} after npm install.",
            "Re-run without --skip-install, or run: npm install",
        )
    if not npm:
        raise CheckError(
            "npm not found",
            "node_modules is incomplete and npm is unavailable.",
            "Reinstall Node.js LTS (includes npm).",
        )
    print("node_modules incomplete — running npm install …", flush=True)
    code = run([npm, "install"], cwd=ROOT)
    if code != 0:
        raise CheckError(
            "npm install failed",
            f"Exit code {code}",
            "Fix the npm errors above, then retry.",
        )


def tauri_cli_js() -> Path:
    p = ROOT / "node_modules" / "@tauri-apps" / "cli" / "tauri.js"
    if p.is_file():
        return p
    alt = ROOT / "node_modules" / "@tauri-apps" / "cli" / "main.js"
    if alt.is_file():
        return alt
    raise CheckError(
        "Tauri CLI missing",
        f"Neither tauri.js nor main.js under {p.parent}",
        "Run: npm install",
    )


def print_banner(action: str) -> None:
    print(
        f"""
+==========================================+
|   Custom Taby Agent — {action:<18} |
+==========================================+
repo: {ROOT}
""",
        flush=True,
    )


def check_deps(*, need_linker: bool) -> tuple[str, str | None, str, Path | None]:
    node = find_node()
    npm = find_npm_cmd()
    cargo = find_cargo()
    link_path: Path | None = None
    if need_linker:
        link_path = check_msvc_linker()

    def ver(cmd: list[str]) -> str:
        try:
            return (
                subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT)
                .strip()
                .splitlines()[0]
            )
        except (subprocess.CalledProcessError, OSError, IndexError):
            return "?"

    print("Environment", flush=True)
    print(f"  node:  {ver([node, '-v'])}  ({node})", flush=True)
    print(
        f"  npm:   {ver([npm, '-v']) if npm else 'not found'}  ({npm or '-'})",
        flush=True,
    )
    print(f"  cargo: {ver([cargo, '-V'])}  ({cargo})", flush=True)
    if IS_WIN:
        shown = str(link_path) if link_path else (which("link") or "not found")
        print(f"  link:  {shown}", flush=True)
    print(flush=True)
    return node, npm, cargo, link_path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Run or build Custom Taby Agent with dependency checks.",
    )
    parser.add_argument(
        "action",
        nargs="?",
        default="dev",
        choices=("dev", "build", "check"),
        help="dev = tauri dev (default), build = release, check = deps only",
    )
    parser.add_argument(
        "--skip-install",
        action="store_true",
        help="Do not run npm install if node_modules is missing",
    )
    parser.add_argument(
        "extra",
        nargs="*",
        help="Extra args passed through to the Tauri CLI",
    )
    args = parser.parse_args(argv)

    action = args.action
    print_banner(action)

    try:
        need_linker = action in ("dev", "build")
        node, npm, _cargo, link_path = check_deps(need_linker=need_linker)

        if action == "check":
            print("All required tools look OK.")
            return 0

        ensure_node_modules(node, npm, args.skip_install)
        cli = tauri_cli_js()

        env = os.environ.copy()
        if link_path and IS_WIN:
            bin_dir = str(link_path.parent)
            env["PATH"] = bin_dir + os.pathsep + env.get("PATH", "")

        cmd = [node, str(cli), action, *args.extra]
        code = run(cmd, cwd=ROOT, env=env)
        if code != 0:
            print(f"\nTauri exited with code {code}.", flush=True)
            if IS_WIN and action in ("dev", "build"):
                print(
                    "\nIf you see link.exe / MSVC errors, open Visual Studio Installer,\n"
                    "Modify Build Tools, enable Desktop development with C++,\n"
                    "then open a new terminal.\n",
                    flush=True,
                )
        return code

    except CheckError as e:
        print(f"\nERROR: {e.title}\n", flush=True)
        print(e.details, flush=True)
        if e.fix:
            print(f"\nFix:\n{e.fix}\n", flush=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
