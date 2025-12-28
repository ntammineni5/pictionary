#!/usr/bin/env python3
"""Test private room join with detailed debugging"""

from playwright.sync_api import sync_playwright
import time

ROOM_URL = "http://localhost:3000/room/05b1e9ae-69b9-4100-8e99-ff31030139bc"

def test_private_room_join():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        # Enable console logging
        page.on("console", lambda msg: print(f"[CONSOLE {msg.type}] {msg.text}"))

        print(f"\n=== Navigating to private room URL ===")
        print(f"URL: {ROOM_URL}\n")

        page.goto(ROOM_URL)

        print(f"\n=== Waiting for page to settle ===")
        time.sleep(3)

        # Check Zustand store state
        print(f"\n=== Checking Zustand store state ===")
        store_state = page.evaluate("""
            () => {
                const store = window.__ZUSTAND_STORE__;
                return {
                    hasStore: !!store,
                    playerName: store?.getState?.()?.playerName,
                    playerId: store?.getState?.()?.playerId,
                    room: store?.getState?.()?.room
                };
            }
        """)
        print(f"Store state: {store_state}")

        # Get all visible text on page
        print(f"\n=== Visible text on page ===")
        body_text = page.locator("body").text_content()
        print(body_text[:500])  # First 500 chars

        # Check what modals/elements are visible
        print(f"\n=== Checking for specific elements ===")
        elements_to_check = [
            "text=Welcome to the Room!",
            "text=Loading room...",
            "text=Waiting for players...",
            "input[placeholder='Enter your name']",
            "button:has-text('Join Room')"
        ]

        for selector in elements_to_check:
            element = page.locator(selector)
            is_visible = element.is_visible() if element.count() > 0 else False
            print(f"  {selector}: {'✓ VISIBLE' if is_visible else '✗ NOT VISIBLE'} (count: {element.count()})")

        # Take screenshot
        page.screenshot(path="/tmp/room_debug.png")
        print(f"\n✓ Screenshot saved to /tmp/room_debug.png")

        # Keep browser open
        print("\n=== Keeping browser open for 10 seconds ===")
        time.sleep(10)

        browser.close()

if __name__ == "__main__":
    test_private_room_join()
