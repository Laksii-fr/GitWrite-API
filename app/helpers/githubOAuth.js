import passport from "passport";
import GitHubStrategy from "passport-github2";
import settings from "../config.js"; // correct relative path

passport.use(
  new GitHubStrategy(
    {
      clientID: settings.GITHUB_CLIENT_ID,
      clientSecret: settings.GITHUB_CLIENT_SECRET,
      callbackURL: settings.GITHUB_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      profile.accessToken = accessToken;
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;
