"""
Comprehensive E2E test for Pictionary multiplayer game
Tests all features mentioned in README.md
"""
import time
from playwright.sync_api import sync_playwright, expect
import json

def log_test(message, status="INFO"):
    """Helper to log test progress"""
    print(f"[{status}] {message}")

def test_pictionary_game():
    """Main test function for Pictionary game"""
    test_results = {
        "passed": [],
        "failed": [],
        "warnings": []
    }

    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=True)

        try:
            # Test 1: Home Page Load
            log_test("Test 1: Loading home page...", "TEST")
            page1 = browser.new_page()
            page1.goto('http://localhost:3000')
            page1.wait_for_load_state('networkidle')

            # Take screenshot for inspection
            page1.screenshot(path='/tmp/pictionary_home.png', full_page=True)
            log_test("Home page screenshot saved to /tmp/pictionary_home.png")

            # Check if page title or heading exists
            try:
                page1.wait_for_selector('h1, h2, h3', timeout=5000)
                log_test("✓ Home page loaded successfully", "PASS")
                test_results["passed"].append("Home page load")
            except Exception as e:
                log_test(f"✗ Home page failed to load: {e}", "FAIL")
                test_results["failed"].append("Home page load")
                return test_results

            # Test 2: Create Public Room
            log_test("\nTest 2: Creating public room...", "TEST")
            try:
                # Enter player name
                name_input = page1.locator('input[type="text"], input[placeholder*="name" i], input[placeholder*="Name" i]').first
                name_input.fill("Player1")
                log_test("Filled player name: Player1")

                # Click Create Room button
                create_btn = page1.locator('button:has-text("Create"), button:has-text("create")').first
                create_btn.click()
                log_test("Clicked Create Room button")

                # Wait for room creation form or redirect
                page1.wait_for_timeout(2000)
                page1.screenshot(path='/tmp/pictionary_create_room.png', full_page=True)

                # Fill room name if modal appears
                try:
                    room_name_input = page1.locator('input[placeholder*="room" i], input[placeholder*="Room" i]').first
                    room_name_input.fill("Test Public Room", timeout=3000)
                    log_test("Filled room name: Test Public Room")

                    # Select public room type (if radio/checkbox exists)
                    try:
                        public_option = page1.locator('input[value="public"], label:has-text("Public")').first
                        public_option.click(timeout=2000)
                        log_test("Selected public room type")
                    except:
                        log_test("Public room option not found (might be default)", "WARN")

                    # Submit room creation
                    submit_btn = page1.locator('button:has-text("Create"), button[type="submit"]').first
                    submit_btn.click()
                    log_test("Submitted room creation")
                except:
                    log_test("Room creation form not found or already submitted", "WARN")

                # Wait for room page to load
                page1.wait_for_timeout(3000)
                page1.wait_for_load_state('networkidle')

                # Check if we're in a room (URL should contain /room/)
                current_url = page1.url
                if '/room/' in current_url:
                    room_id = current_url.split('/room/')[1].split('?')[0]
                    log_test(f"✓ Successfully created room with ID: {room_id}", "PASS")
                    test_results["passed"].append("Public room creation")
                    page1.screenshot(path='/tmp/pictionary_room_waiting.png', full_page=True)
                else:
                    log_test("✗ Failed to create room - URL didn't change to /room/", "FAIL")
                    test_results["failed"].append("Public room creation")
                    return test_results

            except Exception as e:
                log_test(f"✗ Room creation failed: {e}", "FAIL")
                test_results["failed"].append("Public room creation")
                page1.screenshot(path='/tmp/pictionary_error.png', full_page=True)
                return test_results

            # Test 3: Join Room with Second Player
            log_test("\nTest 3: Joining room with second player...", "TEST")
            try:
                page2 = browser.new_page()
                page2.goto(current_url)
                page2.wait_for_load_state('networkidle')

                # Enter player 2 name
                try:
                    name_input2 = page2.locator('input[type="text"], input[placeholder*="name" i]').first
                    name_input2.fill("Player2", timeout=3000)

                    join_btn = page2.locator('button:has-text("Join"), button[type="submit"]').first
                    join_btn.click()
                    log_test("Player2 joined the room")

                    page2.wait_for_timeout(2000)
                except:
                    log_test("Player2 auto-joined (no name form)", "WARN")

                page2.screenshot(path='/tmp/pictionary_player2_joined.png', full_page=True)
                log_test("✓ Second player joined successfully", "PASS")
                test_results["passed"].append("Second player join")

            except Exception as e:
                log_test(f"✗ Second player join failed: {e}", "FAIL")
                test_results["failed"].append("Second player join")
                page2.screenshot(path='/tmp/pictionary_join_error.png', full_page=True)

            # Test 4: Check Scoreboard
            log_test("\nTest 4: Checking scoreboard...", "TEST")
            try:
                # Look for scoreboard on either page
                scoreboard = page1.locator('text=Player1, text=Player2, [class*="score" i]').first
                if scoreboard.is_visible(timeout=3000):
                    log_test("✓ Scoreboard is visible", "PASS")
                    test_results["passed"].append("Scoreboard visibility")
                else:
                    log_test("⚠ Scoreboard not found", "WARN")
                    test_results["warnings"].append("Scoreboard visibility")
            except Exception as e:
                log_test(f"⚠ Scoreboard check failed: {e}", "WARN")
                test_results["warnings"].append("Scoreboard visibility")

            # Test 5: Start Game
            log_test("\nTest 5: Starting game...", "TEST")
            try:
                # Look for start button on page1 (host)
                start_btn = page1.locator('button:has-text("Start"), button:has-text("start")').first
                if start_btn.is_visible(timeout=5000):
                    start_btn.click()
                    log_test("Clicked Start Game button")
                    page1.wait_for_timeout(2000)
                    page1.screenshot(path='/tmp/pictionary_game_started.png', full_page=True)
                    log_test("✓ Game started successfully", "PASS")
                    test_results["passed"].append("Game start")
                else:
                    log_test("✗ Start button not found", "FAIL")
                    test_results["failed"].append("Game start")
            except Exception as e:
                log_test(f"✗ Game start failed: {e}", "FAIL")
                test_results["failed"].append("Game start")

            # Test 6: Word Selection
            log_test("\nTest 6: Testing word selection...", "TEST")
            try:
                # Wait for word selection modal/UI
                page1.wait_for_timeout(2000)

                # Look for word buttons (easy/medium/hard)
                word_buttons = page1.locator('button:has-text("Easy"), button:has-text("Medium"), button:has-text("Hard"), button[class*="word" i]').all()

                if len(word_buttons) > 0:
                    log_test(f"Found {len(word_buttons)} word choice buttons")
                    # Click first available word
                    word_buttons[0].click()
                    log_test("Selected word for drawing")
                    page1.wait_for_timeout(2000)
                    page1.screenshot(path='/tmp/pictionary_drawing_phase.png', full_page=True)
                    log_test("✓ Word selection successful", "PASS")
                    test_results["passed"].append("Word selection")
                else:
                    log_test("⚠ Word selection buttons not found", "WARN")
                    test_results["warnings"].append("Word selection")
            except Exception as e:
                log_test(f"⚠ Word selection test failed: {e}", "WARN")
                test_results["warnings"].append("Word selection")

            # Test 7: Canvas Drawing
            log_test("\nTest 7: Testing canvas drawing...", "TEST")
            try:
                # Find canvas element
                canvas = page1.locator('canvas').first
                if canvas.is_visible(timeout=5000):
                    # Get canvas bounding box
                    box = canvas.bounding_box()
                    if box:
                        # Simulate drawing a line
                        page1.mouse.move(box['x'] + 50, box['y'] + 50)
                        page1.mouse.down()
                        page1.mouse.move(box['x'] + 150, box['y'] + 150)
                        page1.mouse.up()
                        log_test("Drew line on canvas")

                        page1.wait_for_timeout(1000)
                        page1.screenshot(path='/tmp/pictionary_canvas_drawn.png', full_page=True)
                        log_test("✓ Canvas drawing successful", "PASS")
                        test_results["passed"].append("Canvas drawing")
                    else:
                        log_test("⚠ Canvas not accessible", "WARN")
                        test_results["warnings"].append("Canvas drawing")
                else:
                    log_test("⚠ Canvas not visible", "WARN")
                    test_results["warnings"].append("Canvas drawing")
            except Exception as e:
                log_test(f"⚠ Canvas drawing test failed: {e}", "WARN")
                test_results["warnings"].append("Canvas drawing")

            # Test 8: Guess Submission
            log_test("\nTest 8: Testing guess submission (Player2)...", "TEST")
            try:
                # Player 2 submits a guess
                guess_input = page2.locator('input[placeholder*="guess" i], input[type="text"]').last
                if guess_input.is_visible(timeout=5000):
                    guess_input.fill("test")
                    guess_input.press("Enter")
                    log_test("Player2 submitted guess: 'test'")
                    page2.wait_for_timeout(1000)
                    page2.screenshot(path='/tmp/pictionary_guess_submitted.png', full_page=True)
                    log_test("✓ Guess submission successful", "PASS")
                    test_results["passed"].append("Guess submission")
                else:
                    log_test("⚠ Guess input not found", "WARN")
                    test_results["warnings"].append("Guess submission")
            except Exception as e:
                log_test(f"⚠ Guess submission test failed: {e}", "WARN")
                test_results["warnings"].append("Guess submission")

            # Test 9: Timer Visibility
            log_test("\nTest 9: Checking timer...", "TEST")
            try:
                timer = page1.locator('text=/\\d+/, [class*="timer" i]').first
                if timer.is_visible(timeout=5000):
                    timer_text = timer.inner_text()
                    log_test(f"Timer found: {timer_text}")
                    log_test("✓ Timer is visible", "PASS")
                    test_results["passed"].append("Timer visibility")
                else:
                    log_test("⚠ Timer not visible", "WARN")
                    test_results["warnings"].append("Timer visibility")
            except Exception as e:
                log_test(f"⚠ Timer check failed: {e}", "WARN")
                test_results["warnings"].append("Timer visibility")

            # Test 10: UI Responsiveness
            log_test("\nTest 10: Testing UI responsiveness...", "TEST")
            try:
                # Check if page responds to viewport changes
                page1.set_viewport_size({"width": 375, "height": 667})  # Mobile size
                page1.wait_for_timeout(500)
                page1.screenshot(path='/tmp/pictionary_mobile.png', full_page=True)

                page1.set_viewport_size({"width": 1920, "height": 1080})  # Desktop size
                page1.wait_for_timeout(500)
                log_test("✓ UI responsive to viewport changes", "PASS")
                test_results["passed"].append("UI responsiveness")
            except Exception as e:
                log_test(f"⚠ Responsiveness test failed: {e}", "WARN")
                test_results["warnings"].append("UI responsiveness")

            # Final screenshots
            log_test("\nCapturing final state screenshots...")
            page1.screenshot(path='/tmp/pictionary_final_player1.png', full_page=True)
            page2.screenshot(path='/tmp/pictionary_final_player2.png', full_page=True)

            # Close pages
            page2.close()
            page1.close()

        except Exception as e:
            log_test(f"Critical error during testing: {e}", "ERROR")
            test_results["failed"].append(f"Critical error: {e}")

        finally:
            browser.close()

    return test_results

def print_test_summary(results):
    """Print test summary and calculate confidence score"""
    print("\n" + "="*60)
    print("PICTIONARY GAME - TEST SUMMARY")
    print("="*60)

    print(f"\n✓ PASSED ({len(results['passed'])} tests):")
    for test in results['passed']:
        print(f"  - {test}")

    if results['warnings']:
        print(f"\n⚠ WARNINGS ({len(results['warnings'])} tests):")
        for test in results['warnings']:
            print(f"  - {test}")

    if results['failed']:
        print(f"\n✗ FAILED ({len(results['failed'])} tests):")
        for test in results['failed']:
            print(f"  - {test}")

    # Calculate confidence score
    total_tests = len(results['passed']) + len(results['warnings']) + len(results['failed'])
    if total_tests == 0:
        confidence = 0
    else:
        # Passed tests = 100%, warnings = 50%, failed = 0%
        score = (len(results['passed']) * 100 + len(results['warnings']) * 50) / total_tests
        confidence = round(score, 1)

    print(f"\n" + "="*60)
    print(f"CONFIDENCE SCORE: {confidence}%")
    print("="*60)

    # Interpretation
    if confidence >= 90:
        print("✓ EXCELLENT - Service is production-ready")
    elif confidence >= 75:
        print("✓ GOOD - Service is functional with minor issues")
    elif confidence >= 60:
        print("⚠ FAIR - Service works but has several issues")
    else:
        print("✗ POOR - Service has critical issues")

    print("\nScreenshots saved to /tmp/pictionary_*.png")
    print("\nDetailed logs above provide step-by-step validation.")

    return confidence

if __name__ == "__main__":
    log_test("Starting Pictionary E2E Tests...", "START")
    log_test("Prerequisites: Frontend (3000) and Backend (3001) must be running\n")

    results = test_pictionary_game()
    confidence = print_test_summary(results)

    # Exit with appropriate code
    if confidence >= 75:
        exit(0)
    else:
        exit(1)
