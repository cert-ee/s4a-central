export default ({store, $axios}) => {
    // console.log('axios plugin init, set user: ' + store.state.user.username);
    $axios.setHeader("x-remote-user", store.state.user.username);
    $axios.defaults.timeout = 3600000;
}