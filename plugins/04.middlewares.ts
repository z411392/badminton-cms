import { Pages } from "~/lib/constants"
import { withGroupResolving } from "~/lib/modules/GroupManaging/presentation/middlewares/withGroupResolving"
import { withPlaylistResolving } from "~/lib/modules/PlaylistManaging/presentation/middlewares/withPlaylistResolving"
import { withMeetupResolving } from "~/lib/modules/MeetupManaging/presentation/middlewares/withMeetupResolving"
import {
    withRedirectTo,
    withUser,
    ensureGroupIsSpecified,
    ensureUserHasPermission,
    ensurePlaylistIsSpecified,
    ensureMeetupIsSpecified,
} from "~/lib/utils/sessions"

export default defineNuxtPlugin({
    name: "middlewares",
    parallel: false,
    dependsOn: ["firebase"],
    hooks: {
        async "app:beforeMount"() {
            const router = useRouter()
            const route = useRoute()
            if (route.query["customToken"]) {
                const { customToken: _, ...query } = route.query
                await router.replace({ query })
            }
        }
    },
    async setup() {
        addRouteMiddleware("withCredentialsResolving", async ({ name, fullPath, path }) => {
            if (path === "/subscribe") return
            const user = withUser()
            if (name === Pages.SignIn.name) {
                if (!user) return
                const redirectTo = withRedirectTo(true)
                return redirectTo.value
            } else {
                if (user) return
                const redirectTo = withRedirectTo()
                redirectTo.value = fullPath
                return Pages.SignIn.fullPath()
            }
        }, { global: true })
        addRouteMiddleware("withGroupResolving", async ({ name, params }) => {
            const { groupId } = params as { groupId?: string }
            if (!groupId) return
            await withGroupResolving(groupId)
            ensureGroupIsSpecified()
            if (name === Pages.Dashboard.name) return
            ensureUserHasPermission()
        }, { global: true })
        addRouteMiddleware("withPlaylistResolving", async ({ params }) => {
            const { groupId, playlistId } = params as { groupId: string, playlistId?: string }
            if (!playlistId) return
            await withPlaylistResolving(groupId, playlistId)
            ensurePlaylistIsSpecified()
        }, { global: true })
        addRouteMiddleware("withMeetupResolving", async ({ params }) => {
            const { groupId, meetupId } = params as { groupId: string, meetupId?: string }
            if (!meetupId) return
            await withMeetupResolving(groupId, meetupId)
            ensureMeetupIsSpecified()
        }, { global: true })
    }
})