const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 KAHO COMPREHENSIVE END-TO-END AUDIT & TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Security - /admin route must return 404
    // ----------------------------------------------------
    console.log('--- PHASE 1: Security & URL Obscurity ---');
    const rAdmin = await fetch(`${BASE_URL}/admin`);
    assert(rAdmin.status === 404, 'Scanners probing /admin receive 404 Not Found');

    const rHome = await fetch(`${BASE_URL}/`);
    const homeHtml = await rHome.text();
    assert(rHome.status === 200, 'Homepage is live (200 OK)');
    assert(!homeHtml.includes('/admin'), 'Public Footer does not expose any admin link');
    assert(homeHtml.includes('KAHO'), 'Homepage contains KAHO branding');
    assert(homeHtml.includes('Zero identity. 100% truth'), 'Homepage contains official tagline');

    // ----------------------------------------------------
    // TEST 2: User Flow - Instant Frictionless Onboarding
    // ----------------------------------------------------
    console.log('\n--- PHASE 2: User Onboarding & Instant Claim ---');
    const testUsername = 'audit_user_' + Math.floor(Math.random() * 89999 + 10000);
    const rInstant = await fetch(`${BASE_URL}/api/auth/instant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: BASE_URL },
      body: JSON.stringify({ username: testUsername }),
    });
    assert(rInstant.status === 201, `Instant account created for @${testUsername}`, `Status: ${rInstant.status}`);
    const userCookie = rInstant.headers.get('set-cookie');
    assert(!!userCookie, 'Session cookie issued to user upon instant claim');

    // ----------------------------------------------------
    // TEST 3: Public Profile & Confession Sending
    // ----------------------------------------------------
    console.log('\n--- PHASE 3: Public Profile & Anonymous Message Sending ---');
    const rProfile = await fetch(`${BASE_URL}/u/${testUsername}`);
    const profileHtml = await rProfile.text();
    assert(rProfile.status === 200, `Public profile /u/${testUsername} is accessible`);
    assert(profileHtml.includes(`@${testUsername}`), 'Profile displays username correctly');

    // Send confession 1: Normal AMA
    const rSend1 = await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE_URL,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        'X-Forwarded-For': '198.51.100.10',
      },
      body: JSON.stringify({
        username: testUsername,
        body: 'You are genuinely one of the coolest people in college! 🌟',
        gameMode: 'ama',
      }),
    });
    assert(rSend1.status === 201, 'Anonymous AMA confession sent successfully');

    // Send confession 2: Ship Me mode
    const rSend2 = await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE_URL,
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14)',
        'X-Forwarded-For': '198.51.100.20',
      },
      body: JSON.stringify({
        username: testUsername,
        body: 'I ship you with someone from 3rd semester CSE 💕🤫',
        gameMode: 'ship_me',
      }),
    });
    assert(rSend2.status === 201, 'Anonymous Ship Me confession sent successfully');

    // Test Moderation: Hinglish Profanity filter
    const rSendBad = await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        username: testUsername,
        body: 'teri ma ki choot badword',
        gameMode: 'ama',
      }),
    });
    assert(rSendBad.status === 422, 'Profanity/Abuse correctly blocked by moderation filter (422)', `Status: ${rSendBad.status}`);

    // ----------------------------------------------------
    // TEST 4: Recipient Inbox Experience & Actions
    // ----------------------------------------------------
    console.log('\n--- PHASE 4: Recipient Inbox, Replies & Safety Block ---');
    const rInbox = await fetch(`${BASE_URL}/api/inbox`, {
      headers: { Cookie: userCookie },
    });
    assert(rInbox.status === 200, 'Inbox API accessible by authenticated user');
    const inboxData = await rInbox.json();
    assert(inboxData.messages.length === 2, `Inbox received all 2 valid messages (Count: ${inboxData.messages.length})`);

    const msg1 = inboxData.messages.find((m) => m.gameMode === 'ama');
    const msg2 = inboxData.messages.find((m) => m.gameMode === 'ship_me');

    // Mark as read & reply
    const rReply = await fetch(`${BASE_URL}/api/messages/${msg1.id}`, {
      method: 'POST',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Origin: BASE_URL, Cookie: userCookie },
      body: JSON.stringify({ reply: 'Haha thank you so much! Made my day ❤️', isRead: true }),
    });
    assert(rReply.status === 200, 'Recipient replied to confession & marked as read');

    // Test Block Sender Safety Feature
    const rBlock = await fetch(`${BASE_URL}/api/messages/${msg2.id}/block`, {
      method: 'POST',
      headers: { Origin: BASE_URL, Cookie: userCookie },
    });
    assert(rBlock.status === 200, 'Recipient blocked anonymous sender');

    // Verify blocked sender cannot send another message
    const rSendBlockedRetry = await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE_URL,
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14)',
        'X-Forwarded-For': '198.51.100.20', // Same client as msg2
      },
      body: JSON.stringify({
        username: testUsername,
        body: 'Another message after being blocked',
        gameMode: 'ship_me',
      }),
    });
    assert(rSendBlockedRetry.status === 403, 'Blocked sender immediately rejected on retry (403 Forbidden)');

    // ----------------------------------------------------
    // TEST 5: Settings & Password Management
    // ----------------------------------------------------
    console.log('\n--- PHASE 5: Settings, Custom Blocked Words & Password Set ---');
    // Set custom blocked words & display name
    const rPatchMe = await fetch(`${BASE_URL}/api/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Origin: BASE_URL, Cookie: userCookie },
      body: JSON.stringify({
        displayName: 'Rohit Sharma (Official)',
        blockedWords: 'drama,ex_name,gossip',
      }),
    });
    assert(rPatchMe.status === 200, 'Display name and custom blocked words updated');

    // Test custom blocked words enforcement
    const rSendCustomBlocked = await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: BASE_URL },
      body: JSON.stringify({
        username: testUsername,
        body: 'Did you hear the latest gossip about them?',
        gameMode: 'ama',
      }),
    });
    assert(rSendCustomBlocked.status === 422, 'Message containing custom blocked word "gossip" blocked (422)');

    // Instant User sets password
    const newPassword = 'AuditSecurePassword2026!';
    const rSetPw = await fetch(`${BASE_URL}/api/me/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: BASE_URL, Cookie: userCookie },
      body: JSON.stringify({ newPassword }),
    });
    assert(rSetPw.status === 200, 'Instant user successfully set permanent account password');

    // Test Login using Username + New Password
    const rLoginUser = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: BASE_URL },
      body: JSON.stringify({ identifier: testUsername, password: newPassword }),
    });
    assert(rLoginUser.status === 200, 'User logged in successfully using Username + New Password');

    // ----------------------------------------------------
    // TEST 6: Founder HQ & Executive Command Center
    // ----------------------------------------------------
    console.log('\n--- PHASE 6: Founder HQ Security & Management ---');
    // Test Wrong Credentials
    const rHqWrong = await fetch(`${BASE_URL}/api/founder-hq/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: BASE_URL },
      body: JSON.stringify({ username: 'kaho_founder', password: 'wrong_password' }),
    });
    assert(rHqWrong.status === 401, 'Founder HQ rejects wrong credentials (401)');

    // Test Correct Credentials
    const rHqOk = await fetch(`${BASE_URL}/api/founder-hq/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: BASE_URL },
      body: JSON.stringify({ username: 'kaho_founder', password: 'KahoFounder@2026!HQ' }),
    });
    assert(rHqOk.status === 200, 'Founder authenticated with verified credentials');
    const founderCookie = rHqOk.headers.get('set-cookie');
    assert(!!founderCookie, 'Founder HQ session token issued');

    // Fetch Founder Data (KPIs, Influencers Leaderboard, Game Mode breakdown)
    const rHqData = await fetch(`${BASE_URL}/api/founder-hq/data`, {
      headers: { Cookie: founderCookie },
    });
    assert(rHqData.status === 200, 'Founder HQ data endpoint responded (200 OK)');
    const hqData = await rHqData.json();

    assert(hqData.stats.totalUsers >= 2, `Total Users tracked accurately (${hqData.stats.totalUsers})`);
    assert(hqData.stats.totalMessages >= 2, `Total Confessions tracked accurately (${hqData.stats.totalMessages})`);
    assert(Array.isArray(hqData.topInfluencers) && hqData.topInfluencers.length > 0, 'Top Influencers Leaderboard active');
    assert(Array.isArray(hqData.gameModes) && hqData.gameModes.length > 0, 'Game Modes breakdown active');

    // Broadcast Global Announcement
    const testBroadcast = '⚡ Special Weekend Confessions Challenge Live Now!';
    const rAnn = await fetch(`${BASE_URL}/api/founder-hq/announcement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: BASE_URL, Cookie: founderCookie },
      body: JSON.stringify({ message: testBroadcast, active: true }),
    });
    assert(rAnn.status === 200, 'Global broadcast announcement published');

    // Verify Public Announcement Endpoint
    const rPublicAnn = await fetch(`${BASE_URL}/api/announcement`);
    const publicAnnData = await rPublicAnn.json();
    assert(
      publicAnnData?.announcement?.message === testBroadcast && publicAnnData?.announcement?.active === true,
      'Active broadcast announcement confirmed on public API for inboxes'
    );

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    console.log('\n--- CLEANUP ---');
    const Database = require('better-sqlite3');
    const path = require('path');
    const db = new Database(path.join(__dirname, '../data/app.db'));
    db.prepare('DELETE FROM users WHERE username = ?').run(testUsername);
    db.close();
    console.log(`Cleaned up test user @${testUsername}`);

    // Summary
    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================');

    if (failed === 0) {
      console.log('🎉 ALL SYSTEMS 100% OPERATIONAL & PRODUCTION READY!');
    } else {
      console.error('⚠️ SOME TESTS FAILED. PLEASE REVIEW ABOVE LOGS.');
    }
  } catch (err) {
    console.error('Fatal test error:', err);
  }
}

runTests();
