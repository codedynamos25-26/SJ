const axios = require('axios');

const api = axios.create({ baseURL: 'http://localhost:4000/api' });

(async () => {
  try {
    const adminLogin = await api.post('/auth/login', {
      email: 'admin@codedynamos.io',
      password: 'Admin@1234',
    });

    const adminToken = adminLogin.data.token;
    const adminApi = axios.create({
      baseURL: 'http://localhost:4000/api',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const tempEmail = `tmp-${Date.now()}@codedynamos.io`;
    const signup = await api.post('/auth/signup', {
      name: 'Temp Validation User',
      email: tempEmail,
      password: 'TempPass123!',
      track: 'Fullstack',
    });

    const memberToken = signup.data.token;
    const memberApi = axios.create({
      baseURL: 'http://localhost:4000/api',
      headers: { Authorization: `Bearer ${memberToken}` },
    });

    const meBefore = (await memberApi.get('/auth/me')).data;
    const originalTrack = meBefore.track;
    const originalXp = meBefore.xp;

    const trackUpdate = await memberApi.put('/user/profile', { track: 'Backend' });
    if (trackUpdate.data.track !== 'Backend') {
      throw new Error(`track update failed: ${trackUpdate.data.track}`);
    }
    console.log('TRACK OK', trackUpdate.data.track);

    const event = (await memberApi.get('/events/ev2')).data;
    const originalEventEnrollmentXp = Number(event.enrollmentXp || 0);
    const originalEventStatus = event.status;
    const originalEventEndsAt = event.endsAt || null;
    const testEventEnrollmentXp = originalEventEnrollmentXp + 5;
    const testEventEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await adminApi.patch(`/admin/events/${event.id}`, {
      enrollmentXp: testEventEnrollmentXp,
      status: 'Open',
      endsAt: testEventEndsAt,
    });

    const patchedEvent = (await memberApi.get(`/events/${event.id}`)).data;
    if (Number(patchedEvent.enrollmentXp || 0) !== testEventEnrollmentXp || patchedEvent.status !== 'Open') {
      throw new Error('event patch failed');
    }

    await memberApi.post(`/events/${event.id}/rsvp`);
    const eventAfterEnroll = (await memberApi.get('/auth/me')).data;
    if (eventAfterEnroll.xp !== originalXp + testEventEnrollmentXp) {
      throw new Error(`event enroll xp mismatch: expected ${originalXp + testEventEnrollmentXp}, got ${eventAfterEnroll.xp}`);
    }
    await memberApi.delete(`/events/${event.id}/rsvp`);
    const eventAfterCancel = (await memberApi.get('/auth/me')).data;
    if (eventAfterCancel.xp !== originalXp) {
      throw new Error(`event cancel xp mismatch: expected ${originalXp}, got ${eventAfterCancel.xp}`);
    }
    await adminApi.patch(`/admin/events/${event.id}`, {
      enrollmentXp: originalEventEnrollmentXp,
      status: originalEventStatus,
      endsAt: originalEventEndsAt,
    });
    console.log('EVENT XP OK', event.id, testEventEnrollmentXp);

    const challenge = (await memberApi.get('/challenges/ch9')).data;
    const originalChallengeEnrollmentXp = Number(challenge.enrollmentXp || 0);
    const originalChallengeStatus = challenge.status || 'Open';
    const originalChallengeEndsAt = challenge.endsAt || null;
    const challengeEnrollmentXp = originalChallengeEnrollmentXp + 5;
    const testChallengeEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await adminApi.patch(`/admin/challenges/${challenge.id}`, {
      enrollmentXp: challengeEnrollmentXp,
      status: 'Open',
      endsAt: testChallengeEndsAt,
    });

    const patchedChallenge = (await adminApi.get('/admin/challenges')).data.find((item) => item.id === challenge.id);
    if (!patchedChallenge || Number(patchedChallenge.enrollmentXp || 0) !== challengeEnrollmentXp || patchedChallenge.status !== 'Open') {
      throw new Error('challenge patch failed');
    }

    await memberApi.post(`/challenges/${challenge.id}/enroll`);
    const challengeAfterEnroll = (await memberApi.get('/auth/me')).data;
    if (challengeAfterEnroll.xp !== originalXp + challengeEnrollmentXp) {
      throw new Error(`challenge enroll xp mismatch: expected ${originalXp + challengeEnrollmentXp}, got ${challengeAfterEnroll.xp}`);
    }
    await memberApi.delete(`/challenges/${challenge.id}/enroll`);
    const challengeAfterCancel = (await memberApi.get('/auth/me')).data;
    if (challengeAfterCancel.xp !== originalXp) {
      throw new Error(`challenge withdraw xp mismatch: expected ${originalXp}, got ${challengeAfterCancel.xp}`);
    }
    await adminApi.patch(`/admin/challenges/${challenge.id}`, {
      enrollmentXp: originalChallengeEnrollmentXp,
      status: originalChallengeStatus,
      endsAt: originalChallengeEndsAt,
    });
    console.log('CHALLENGE XP OK', challenge.id, challengeEnrollmentXp);

    await memberApi.put('/user/profile', { track: originalTrack });
    const restored = (await memberApi.get('/auth/me')).data;
    if (restored.track !== originalTrack) {
      throw new Error(`track restore failed: expected ${originalTrack}, got ${restored.track}`);
    }
    console.log('RESTORE OK', restored.track);
    console.log('DONE');
  } catch (err) {
    if (err.response) {
      console.error('ERR', err.response.status, err.response.data);
    } else {
      console.error(err.message || err);
    }
    process.exit(1);
  }
})();
