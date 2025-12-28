#!/usr/bin/env python3
"""Final test: Create room and join from another browser"""

from playwright.sync_api import sync_playwright
import time
import re

def test_complete_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)

        print("\n" + "="*60)
        print("TEST: Private Room Creation and Join")
        print("="*60)

        # PLAYER 1: Create room
        context1 = browser.new_context()
        page1 = context1.new_page()

        print("\n[Player 1] Creating private room...")
        page1.goto("http://localhost:3000")
        time.sleep(1)

        # Fill name
        page1.fill('input[placeholder="Enter your name"]', "Alice")
        page1.click('button:has-text("Create Room")')
        time.sleep(0.5)

        # Fill room details
        page1.fill('input[placeholder="Enter room name"]', "Alice's Game")
        page1.click('button:has-text("Private")')
        time.sleep(0.3)

        # Create room
        page1.click('button[type="submit"]:has-text("Create Room")')
        time.sleep(3)

        # Extract room ID from current page
        page1.wait_for_selector('text=Waiting for players...', timeout=5000)
        room_id = None
        match = re.search(r'/room/([a-f0-9-]+)', page1.url)
        if match:
            room_id = match.group(1)
            print(f"[Player 1] ✓ Room created: {room_id}")
        else:
            # Try to get from page content
            room_id_text = page1.locator('text=/Room ID:/')
            if room_id_text.is_visible():
                full_text = room_id_text.text_content()
                match = re.search(r'Room ID: ([a-f0-9-]+)', full_text)
                if match:
                    room_id = match.group(1)
                    print(f"[Player 1] ✓ Room created: {room_id}")

        if not room_id:
            print("[Player 1] ✗ Failed to extract room ID!")
            browser.close()
            return

        room_url = f"http://localhost:3000/room/{room_id}"
        print(f"[Player 1] Room URL: {room_url}")

        # PLAYER 2: Join room
        context2 = browser.new_context()
        page2 = context2.new_page()

        print(f"\n[Player 2] Opening private link: {room_url}")
        page2.goto(room_url)
        time.sleep(2)

        # Should see name prompt
        name_prompt = page2.locator('text=Welcome to the Room!')
        if name_prompt.is_visible():
            print("[Player 2] ✓ Name prompt visible")

            # Enter name
            page2.fill('input[placeholder="Enter your name"]', "Bob")
            print("[Player 2] ✓ Name entered: Bob")

            # Join room
            page2.click('button:has-text("Join Room")')
            print("[Player 2] ✓ Clicked Join Room")

            # Wait for join
            time.sleep(3)

            # Check if joined
            if page2.locator('text=Waiting for players...').is_visible():
                print("[Player 2] ✓ SUCCESSFULLY JOINED!")

                # Verify both players visible
                body_text = page2.text_content('body')
                if 'Alice' in body_text and 'Bob' in body_text:
                    print("[Player 2] ✓ Both players visible in lobby!")
                    print("\n" + "="*60)
                    print("✓✓✓ TEST PASSED ✓✓✓")
                    print("="*60)
                else:
                    print("[Player 2] ⚠ Not all players visible")

            else:
                print("[Player 2] ✗ Failed to join - not in waiting lobby")
                if page2.locator('text=Loading room...').is_visible():
                    print("[Player 2] ✗ Stuck in loading state")

        else:
            print("[Player 2] ✗ Name prompt NOT visible!")

        # Keep browsers open
        print("\nKeeping browsers open for inspection (10 seconds)...")
        time.sleep(10)

        browser.close()

if __name__ == "__main__":
    test_complete_flow()
