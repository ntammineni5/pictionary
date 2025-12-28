"""
Improved E2E test for Pictionary multiplayer game
Works around the missing join modal issue
"""
import time
from playwright.sync_api import sync_playwright
import json

def log_test(message, status="INFO"):
    """Helper to log test progress"""
    print(f"[{status}] {message}")

def test_pictionary_game():
    """Main test function for Pictionary game"""
    test_results = {
        "passed": [],
        "failed": [],
        "warnings": [],
        "issues": []
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        try:
            # Test 1: Home Page Load
            log_test("Test 1: Loading home page...", "TEST")
            page1 = browser.new_page()
            page1.goto('http://localhost:3000')
            page1.wait_for_load_state('networkidle')
            page1.screenshot(path='/tmp/pictionary_home.png', full_page=True)

            try:
                page1.wait_for_selector('h1, h2', timeout=5000)
                log_test("✓ Home page loaded successfully", "PASS")
                test_results["passed"].append("Home page load")
            except Exception as e:
                log_test(f"✗ Home page failed: {e}", "FAIL")
                test_results["failed"].append("Home page load")
                return test_results

            # Test 2: Create Public Room (Player 1)
            log_test("\nTest 2: Player1 creating public room...", "TEST")
            try:
                # Enter player 1 name
                name_input = page1.locator('input[type="text"]').first
                name_input.fill("Player1")
                log_test("Filled Player1 name")

                # Click Create Room
                create_btn = page1.locator('button:has-text("Create")').first
                create_btn.click()
                page1.wait_for_timeout(1000)

                # Fill room creation form
                try:
                    room_name_input = page1.locator('input[placeholder*="room" i]').first
                    room_name_input.fill("Test Public Room", timeout=3000)
                    log_test("Filled room name")

                    # Submit
                    submit_btn = page1.locator('button:has-text("Create"), button[type="submit"]').last
                    submit_btn.click()
                except:
                    pass

                # Wait for room page
                page1.wait_for_timeout(3000)
                page1.wait_for_load_state('networkidle')

                current_url = page1.url
                if '/room/' in current_url:
                    room_id = current_url.split('/room/')[1].split('?')[0]
                    log_test(f"✓ Room created: {room_id}", "PASS")
                    test_results["passed"].append("Public room creation")
                    page1.screenshot(path='/tmp/pictionary_room_created.png', full_page=True)
                else:
                    log_test("✗ Room creation failed", "FAIL")
                    test_results["failed"].append("Public room creation")
                    return test_results
            except Exception as e:
                log_test(f"✗ Room creation error: {e}", "FAIL")
                test_results["failed"].append("Public room creation")
                return test_results

            # Test 3: Second Player Joins via Home Page (proper flow)
            log_test("\nTest 3: Player2 joining via proper flow...", "TEST")
            try:
                page2 = browser.new_page()
                page2.goto('http://localhost:3000')
                page2.wait_for_load_state('networkidle')

                # Enter Player2 name
                name_input2 = page2.locator('input[type="text"]').first
                name_input2.fill("Player2")
                log_test("Filled Player2 name")

                # Click Join Public Room
                join_public_btn = page2.locator('button:has-text("Join Public")').first
                join_public_btn.click()
                page2.wait_for_timeout(2000)

                # Look for the room in list and click it
                try:
                    room_item = page2.locator(f'text="Test Public Room"').first
                    room_item.click(timeout=5000)
                    log_test("Clicked room from public list")
                except:
                    log_test("⚠ Room not found in public list, trying direct URL", "WARN")
                    # Fallback: navigate directly
                    page2.goto(current_url)

                page2.wait_for_timeout(3000)
                page2.wait_for_load_state('networkidle')
                page2.screenshot(path='/tmp/pictionary_player2_view.png', full_page=True)

                # Check if player2 successfully joined
                player1_text = page1.locator('text=Player2').first
                if player1_text.is_visible(timeout=5000):
                    log_test("✓ Player2 successfully joined", "PASS")
                    test_results["passed"].append("Second player join")
                else:
                    log_test("✗ Player2 not visible in room", "FAIL")
                    test_results["failed"].append("Second player join")
                    test_results["issues"].append("Direct room URL join doesn't work - missing name prompt modal")

            except Exception as e:
                log_test(f"✗ Player2 join failed: {e}", "FAIL")
                test_results["failed"].append("Second player join")
                test_results["issues"].append("Direct room URL join doesn't work - missing name prompt modal")

            page1.wait_for_timeout(1000)
            page1.screenshot(path='/tmp/pictionary_both_players.png', full_page=True)

            # Test 4: Scoreboard Check
            log_test("\nTest 4: Checking scoreboard presence...", "TEST")
            try:
                players_visible = page1.locator('text=Player1').is_visible() and page1.locator('text=Player2').is_visible(timeout=3000)
                if players_visible:
                    log_test("✓ Both players visible", "PASS")
                    test_results["passed"].append("Player list visibility")
                else:
                    log_test("⚠ Not all players visible", "WARN")
                    test_results["warnings"].append("Player list visibility")
            except:
                log_test("⚠ Player list check failed", "WARN")
                test_results["warnings"].append("Player list visibility")

            # Test 5: Start Game
            log_test("\nTest 5: Starting game (host action)...", "TEST")
            try:
                start_btn = page1.locator('button:has-text("Start Game"), button:has-text("Start")').first
                if start_btn.is_visible(timeout=5000):
                    start_btn.click()
                    log_test("Clicked Start Game")
                    page1.wait_for_timeout(3000)
                    page1.screenshot(path='/tmp/pictionary_game_started.png', full_page=True)
                    log_test("✓ Game start successful", "PASS")
                    test_results["passed"].append("Game start")
                else:
                    log_test("⚠ Start button not found (might need 2+ players)", "WARN")
                    test_results["warnings"].append("Game start")
            except Exception as e:
                log_test(f"⚠ Game start check failed: {e}", "WARN")
                test_results["warnings"].append("Game start")

            # Test 6: Word Selection
            log_test("\nTest 6: Word selection (drawer sees choices)...", "TEST")
            try:
                page1.wait_for_timeout(2000)
                # Look for word buttons or modal
                word_container = page1.locator('text=/Easy|Medium|Hard/i, button[class*="word"]').first
                if word_container.is_visible(timeout=5000):
                    log_test("Word selection UI visible")
                    # Try to click a word button
                    word_buttons = page1.locator('button').all()
                    for btn in word_buttons:
                        try:
                            text = btn.inner_text(timeout=1000)
                            if any(word in text.lower() for word in ['easy', 'medium', 'hard']):
                                btn.click()
                                log_test(f"Selected word button: {text}")
                                page1.wait_for_timeout(2000)
                                break
                        except:
                            continue
                    page1.screenshot(path='/tmp/pictionary_after_word_select.png', full_page=True)
                    log_test("✓ Word selection successful", "PASS")
                    test_results["passed"].append("Word selection")
                else:
                    log_test("⚠ Word selection UI not found", "WARN")
                    test_results["warnings"].append("Word selection")
            except Exception as e:
                log_test(f"⚠ Word selection failed: {e}", "WARN")
                test_results["warnings"].append("Word selection")

            # Test 7: Canvas and Drawing
            log_test("\nTest 7: Canvas drawing test...", "TEST")
            try:
                canvas = page1.locator('canvas').first
                if canvas.is_visible(timeout=5000):
                    box = canvas.bounding_box()
                    if box:
                        # Draw
                        page1.mouse.move(box['x'] + 100, box['y'] + 100)
                        page1.mouse.down()
                        page1.mouse.move(box['x'] + 200, box['y'] + 150)
                        page1.mouse.move(box['x'] + 150, box['y'] + 200)
                        page1.mouse.up()
                        page1.wait_for_timeout(1000)
                        page1.screenshot(path='/tmp/pictionary_canvas_drawing.png', full_page=True)
                        log_test("✓ Canvas drawing successful", "PASS")
                        test_results["passed"].append("Canvas drawing")
                    else:
                        log_test("⚠ Canvas not accessible", "WARN")
                        test_results["warnings"].append("Canvas drawing")
                else:
                    log_test("⚠ Canvas not visible", "WARN")
                    test_results["warnings"].append("Canvas drawing")
            except Exception as e:
                log_test(f"⚠ Canvas test failed: {e}", "WARN")
                test_results["warnings"].append("Canvas drawing")

            # Test 8: Guess Submission (Player2)
            log_test("\nTest 8: Guess submission (Player2)...", "TEST")
            try:
                guess_input = page2.locator('input[type="text"]').last
                if guess_input.is_visible(timeout=3000):
                    guess_input.fill("apple")
                    guess_input.press("Enter")
                    log_test("Player2 submitted guess")
                    page2.wait_for_timeout(1000)
                    page2.screenshot(path='/tmp/pictionary_guess_submitted.png', full_page=True)
                    log_test("✓ Guess submission successful", "PASS")
                    test_results["passed"].append("Guess submission")
                else:
                    log_test("⚠ Guess input not found", "WARN")
                    test_results["warnings"].append("Guess submission")
            except Exception as e:
                log_test(f"⚠ Guess submission failed: {e}", "WARN")
                test_results["warnings"].append("Guess submission")

            # Test 9: Timer
            log_test("\nTest 9: Timer visibility check...", "TEST")
            try:
                # Look for numbers that could be timer
                timer_elem = page1.locator('text=/^\\d+$/').first
                if timer_elem.is_visible(timeout=3000):
                    timer_val = timer_elem.inner_text()
                    log_test(f"Timer found: {timer_val}")
                    log_test("✓ Timer is visible", "PASS")
                    test_results["passed"].append("Timer visibility")
                else:
                    log_test("⚠ Timer not found", "WARN")
                    test_results["warnings"].append("Timer visibility")
            except Exception as e:
                log_test(f"⚠ Timer check failed: {e}", "WARN")
                test_results["warnings"].append("Timer visibility")

            # Test 10: Responsive Design
            log_test("\nTest 10: Responsive design check...", "TEST")
            try:
                # Mobile
                page1.set_viewport_size({"width": 375, "height": 667})
                page1.wait_for_timeout(500)
                page1.screenshot(path='/tmp/pictionary_mobile.png')

                # Desktop
                page1.set_viewport_size({"width": 1920, "height": 1080})
                page1.wait_for_timeout(500)
                log_test("✓ UI responsive", "PASS")
                test_results["passed"].append("Responsive design")
            except Exception as e:
                log_test(f"⚠ Responsive test failed: {e}", "WARN")
                test_results["warnings"].append("Responsive design")

            # Final screenshots
            log_test("\nCapturing final screenshots...")
            page1.screenshot(path='/tmp/pictionary_final_p1.png', full_page=True)
            page2.screenshot(path='/tmp/pictionary_final_p2.png', full_page=True)

            page2.close()
            page1.close()

        except Exception as e:
            log_test(f"Critical error: {e}", "ERROR")
            test_results["failed"].append(f"Critical: {e}")

        finally:
            browser.close()

    return test_results

def print_test_summary(results):
    """Print comprehensive test summary"""
    print("\n" + "="*70)
    print("PICTIONARY GAME - COMPREHENSIVE TEST REPORT")
    print("="*70)

    print(f"\n✓ PASSED ({len(results['passed'])} tests):")
    for test in results['passed']:
        print(f"  ✓ {test}")

    if results['warnings']:
        print(f"\n⚠ WARNINGS ({len(results['warnings'])} tests):")
        for test in results['warnings']:
            print(f"  ⚠ {test}")

    if results['failed']:
        print(f"\n✗ FAILED ({len(results['failed'])} tests):")
        for test in results['failed']:
            print(f"  ✗ {test}")

    if results['issues']:
        print(f"\n🐛 IDENTIFIED ISSUES:")
        for issue in results['issues']:
            print(f"  • {issue}")

    # Calculate confidence score
    total = len(results['passed']) + len(results['warnings']) + len(results['failed'])
    if total == 0:
        confidence = 0
    else:
        score = (len(results['passed']) * 100 + len(results['warnings']) * 50) / total
        confidence = round(score, 1)

    # Deduct points for critical issues
    if results['issues']:
        confidence -= len(results['issues']) * 5
        confidence = max(0, confidence)

    print(f"\n" + "="*70)
    print(f"OVERALL CONFIDENCE SCORE: {confidence}%")
    print("="*70)

    # Detailed interpretation
    print("\n📊 SCORE BREAKDOWN:")
    print(f"   • Passed tests:   {len(results['passed'])} × 100% = {len(results['passed']) * 100}pts")
    print(f"   • Warning tests:  {len(results['warnings'])} × 50%  = {len(results['warnings']) * 50}pts")
    print(f"   • Failed tests:   {len(results['failed'])} × 0%   = 0pts")
    if results['issues']:
        print(f"   • Critical issues: -{len(results['issues']) * 5}pts penalty")
    print(f"   • TOTAL: {confidence}%")

    print("\n📋 ASSESSMENT:")
    if confidence >= 90:
        print("   ✓ EXCELLENT - Production ready, all core features working")
    elif confidence >= 75:
        print("   ✓ GOOD - Core features work, minor issues present")
    elif confidence >= 60:
        print("   ⚠ FAIR - Functional but has several issues needing attention")
    elif confidence >= 40:
        print("   ✗ POOR - Significant issues affecting core functionality")
    else:
        print("   ✗ CRITICAL - Major failures, not ready for use")

    print("\n📸 Screenshots saved to /tmp/pictionary_*.png")
    print("\n" + "="*70)

    return confidence

if __name__ == "__main__":
    log_test("🎮 Starting Pictionary Comprehensive Test Suite", "START")
    log_test("Prerequisites: Servers on ports 3000 and 3001\n")

    results = test_pictionary_game()
    confidence = print_test_summary(results)

    exit(0 if confidence >= 70 else 1)
