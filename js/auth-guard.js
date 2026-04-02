/**
 * auth-guard.js — Redirect to login if not authenticated
 * Include after js/supabase.js on every protected page.
 * Guests (localStorage isGuest=true + playerName) are allowed through.
 */
(async function () {
  if (typeof db === 'undefined') return;
  const { data } = await db.auth.getSession();
  if (!data.session) {
    // Allow guests who have set a name
    if (localStorage.getItem('isGuest') === 'true' && localStorage.getItem('playerName')) return;
    localStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.replace('/login.html');
  }
})();
