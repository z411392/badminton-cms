import { initializeApp } from 'firebase/app'
import { type User, getAuth, setPersistence, browserLocalPersistence, signInWithCustomToken, onAuthStateChanged, onIdTokenChanged } from 'firebase/auth'
import { createConsola } from "consola"
import { defineNuxtPlugin } from 'nuxt/app'
import { withResolvers } from '~/lib/utils/promises'
import { Settings } from "luxon"
import { default as axiosFactory } from "axios"
// import VConsole from "vconsole"

const idToken = ref<string>()
const logger = createConsola().withTag(`firebase`)

export default defineNuxtPlugin({
    name: "firebase",
    parallel: false,
    dependsOn: ["polyfill"],
    hooks: {
        async "app:created"() {
            const { public: { timezone, firebase } } = useRuntimeConfig()
            Settings.defaultZone = timezone
            initializeApp(firebase)
            const auth = getAuth()
            onIdTokenChanged(auth, async (user) => {
                if (user) idToken.value = await user.getIdToken()
                else idToken.value = undefined
            })
            await setPersistence(auth, browserLocalPersistence)
            const route = useRoute()
            const { customToken } = route.query as { customToken?: string }
            if (!customToken) return
            const { promise, resolve, reject } = withResolvers<User>()
            const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
                if (user) return resolve(user)
            }, reject)
            try {
                await signInWithCustomToken(auth, customToken)
                setTimeout(() => reject(new Error()), 5000)
                await promise
            } catch (error) {
                logger.error((error as Error).message)
            } finally {
                unsubscribe()
            }
        },
        async "app:beforeMount"() {
            // new VConsole({})
        }
    },
    async setup() {
        const { public: { apiBaseURL } } = useRuntimeConfig()
        const axios = computed(() => {
            const headers: any = {}
            if (idToken.value) headers[`authorization`] = `bearer ${idToken.value}`
            return axiosFactory.create({
                baseURL: apiBaseURL,
                headers,
            })
        })
        return {
            provide: {
                axios,
            }
        }
    }
})