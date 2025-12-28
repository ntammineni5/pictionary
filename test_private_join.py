#!/usr/bin/env python3
"""Test private room join functionality"""

from playwright.sync_api import sync_playwright
import time

ROOM_URL = "http://localhost:3000/room/05b1e9ae-69b9-4100-8e99-ff31030139bc"

def test_private_room_join():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # headless=False to see what happens
        context = browser.new_context()
        page = context.new_page()

        # Enable console logging
        page.on("console", lambda msg: print(f"[CONSOLE] {msg.type}: {msg.text}"))

        # Enable network logging for socket events
        page.on("request", lambda req: print(f"[REQUEST] {req.method} {req.url}"))
        page.on("response", lambda res: print(f"[RESPONSE] {res.status} {res.url}"))

        print(f"\n=== Navigating to private room URL ===")
        print(f"URL: {ROOM_URL}\n")

        page.goto(ROOM_URL, wait_until="networkidle")

        print(f"\n=== Current URL after navigation ===")
        print(f"{page.url}\n")

        # Wait a bit to see what renders
        time.sleep(2)

        # Check if name prompt modal appears
        print(f"\n=== Checking for name prompt modal ===")
        name_modal = page.locator('text=Welcome to the Room!')
        if name_modal.is_visible():
            print("✓ Name prompt modal is visible")

            # Enter name
            name_input = page.locator('input[placeholder="Enter your name"]')
            print("✓ Found name input field")

            name_input.fill("Test Player")
            print("✓ Entered name: Test Player")

            # Submit
            join_button = page.locator('button:has-text("Join Room")')
            print("✓ Found Join Room button")

            join_button.click()
            print("✓ Clicked Join Room button")

            # Wait for navigation or room to load
            time.sleep(3)

            print(f"\n=== After joining ===")
            print(f"Current URL: {page.url}")

            # Check if we're in the room
            if page.locator('text=Loading room...').is_visible():
                print("⚠ Still showing 'Loading room...' - stuck in loading state")
            elif page.locator('text=Waiting for players...').is_visible():
                print("✓ Successfully joined! Now in waiting lobby")
            else:
                # Take screenshot to see what's on screen
                page.screenshot(path="/tmp/room_state.png")
                print(f"✗ Unknown state - screenshot saved to /tmp/room_state.png")
                print(f"Page title: {page.title()}")

        else:
            print("✗ Name prompt modal NOT visible")

            # Check what is visible instead
            if page.locator('text=Loading room...').is_visible():
                print("⚠ Showing 'Loading room...' - infinite loading state")
            else:
                page.screenshot(path="/tmp/unexpected_state.png")
                print(f"✗ Unexpected state - screenshot saved to /tmp/unexpected_state.png")

        # Keep browser open for a moment
        print("\n=== Keeping browser open for inspection ===")
        time.sleep(5)

        browser.close()

if __name__ == "__main__":
    test_private_room_join()
