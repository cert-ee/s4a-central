// // Log logged in user's API requests
// module.exports = (app) => {
//   app.remotes().before('**', async (ctx) => {
//     const { accessToken } = ctx.req;
//
//     // ignore unauthenticated requests
//     if (!accessToken) return;
//
//     const user = await accessToken.user.get();
//     console.log(`${user.username} => ${ctx.req.url}`);
//   });
// };
