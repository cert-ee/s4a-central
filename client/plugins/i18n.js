import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

const i18n = new VueI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
        'en': require('~/locales/en.json'),
        'ru': require('~/locales/ru.json')
    }
});

export default ({ app, store }) => {
    // Set i18n instance on app
    // This way we can use it in middleware and pages asyncData/fetch
    i18n.locale = store.state.locale;
    app.i18n = i18n;
}

export {i18n}