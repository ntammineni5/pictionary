#!/usr/bin/env python3
"""Test complete private room creation and join flow"""

from playwright.sync_api import sync_playwright
import time
import re

def test_private_room_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)

        # Context 1: Create room
        context1 = browser.new_context()
        page1 = context1.new_page()

        print("\n=== PLAYER 1: Creating private room ===")
        page1.goto("http://localhost:3000")
        time.sleep(1)

        # Enter name
        page1.fill('input[placeholder="Enter your name"]', "Player 1")
        time.sleep(0.5)

        # Click Create Room
        page1.click('button:has-text("Create Room")')
        time.sleep(0.5)

        # Enter room name
        page1.fill('input[placeholder="Enter room name"]', "Test Private Room")

        # Select Private room type
        page1.click('button:has-text("Private")')
        time.sleep(0.5)

        # Create the room
        page1.click('button:has-text("Create Room")', timeout=5000)
        time.sleep(2)

        # Get the room URL
        room_url = page1.url
        print(f"✓ Room created: {room_url}")

        # Verify we're in the waiting lobby
        if page1.locator('text=Waiting for players...').is_visible():
            print("✓ Player 1 is in waiting lobby")
        else:
            print("✗ Player 1 NOT in waiting lobby!")
            return

        # Context 2: Join room from another browser
        context2 = browser.new_context()
        page2 = context2.new_page()

        print(f"\n=== PLAYER 2: Joining room via private link ===")
        print(f"URL: {room_url}")
        page2.goto(room_url)
        time.sleep(2)

        # Should see name prompt
        if page2.locator('text=Welcome to the Room!').is_visible():
            print("✓ Name prompt visible")

            # Enter name
            page2.fill('input[placeholder="Enter your name"]', "Player 2")
            time.sleep(0.5)

            # Click Join Room
            page2.click('button:has-text("Join Room")')
            print("✓ Clicked Join Room")

            # Wait for join to complete
            time.sleep(3)

            # Check if successfully joined
            if page2.locator('text=Waiting for players...').is_visible():
                print("✓ Player 2 successfully joined the waiting lobby!")

                # Verify both players are visible
                players_text = page2.text_content('body')
                if 'Player 1' in players_text and 'Player 2' in players_text:
                    print("✓ Both players visible in lobby!")
                else:
                    print("⚠ Not all players visible")

            elif page2.locator('text=Loading room...').is_visible():
                print("✗ Player 2 stuck in loading state")
            else:
                print(f"✗ Player 2 in unknown state")
                print(f"Current URL: {page2.url}")

        else:
            print("✗ Name prompt NOT visible")

        # Keep browsers open for inspection
        print("\n=== Test complete, keeping browsers open for 10 seconds ===")
        time.sleep(10)

        browser.close()

if __name__ == "__main__":
    test_private_room_flow()
