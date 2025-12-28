#!/usr/bin/env python3
"""Debug room creation"""

from playwright.sync_api import sync_playwright
import time

def test_room_creation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        # Enable console logging
        page.on("console", lambda msg: print(f"[CONSOLE] {msg.text}"))

        print("\n=== Creating private room ===")
        page.goto("http://localhost:3000")
        time.sleep(2)

        print("✓ Page loaded")

        # Enter name
        name_input = page.locator('input[placeholder="Enter your name"]')
        if name_input.is_visible():
            print("✓ Name input visible")
            name_input.fill("Test Player")
            print("✓ Name entered")
        else:
            print("✗ Name input NOT visible")
            return

        time.sleep(0.5)

        # Click Create Room
        create_btn = page.locator('button:has-text("Create Room")')
        if create_btn.is_visible():
            print("✓ Create Room button visible")
            create_btn.click()
            print("✓ Create Room clicked")
        else:
            print("✗ Create Room button NOT visible")
            return

        time.sleep(1)

        # Should be on create room form
        print(f"Current URL after clicking Create Room: {page.url}")

        # Enter room name
        room_name_input = page.locator('input[placeholder="Enter room name"]')
        if room_name_input.is_visible():
            print("✓ Room name input visible")
            room_name_input.fill("Test Private Room")
            print("✓ Room name entered")
        else:
            print("✗ Room name input NOT visible")
            return

        # Select Private room type
        private_btn = page.locator('button:has-text("Private")')
        if private_btn.is_visible():
            print("✓ Private button visible")
            private_btn.click()
            print("✓ Private selected")
        else:
            print("✗ Private button NOT visible")
            return

        time.sleep(0.5)

        # Create the room
        final_create_btn = page.locator('button[type="submit"]:has-text("Create Room")')
        if final_create_btn.is_visible():
            print("✓ Final Create Room button visible")
            final_create_btn.click()
            print("✓ Final Create Room clicked")
        else:
            print("✗ Final Create Room button NOT visible")
            return

        # Wait for redirect
        print("\nWaiting for redirect...")
        time.sleep(5)

        print(f"\nFinal URL: {page.url}")

        # Check what's on the page
        if page.locator('text=Waiting for players...').is_visible():
            print("✓ SUCCESS: In waiting lobby!")
            # Extract room ID from URL
            import re
            match = re.search(r'/room/([^/]+)', page.url)
            if match:
                room_id = match.group(1)
                print(f"✓ Room ID: {room_id}")
        elif page.locator('text=Loading room...').is_visible():
            print("⚠ Stuck in loading state")
        else:
            page.screenshot(path="/tmp/create_room_state.png")
            print(f"✗ Unknown state - screenshot saved")

        # Keep browser open
        print("\nKeeping browser open for 10 seconds...")
        time.sleep(10)

        browser.close()

if __name__ == "__main__":
    test_room_creation()
