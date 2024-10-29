<script lang="ts" setup>
import {
    Pages,
    // PageSizes,
} from "~/lib/constants"
import { type Group } from "~/lib/modules/GroupManaging/dtos/Group"
import { onSigningOut } from "~/lib/modules/IdentityAndAccessManaging/presentation/controllers/onSigningOut"
import { getAuth } from "firebase/auth"
import { onCountingGroups } from "~/lib/modules/GroupManaging/presentation/controllers/onCountingGroups"
import { onListingGroups } from "~/lib/modules/GroupManaging/presentation/controllers/onListingGroups"
import Snackbar from "~/components/utils/Snackbar.vue"
import { useSnackbar } from "~/composables/utils/useSnackbar"
import { watchIgnorable } from "@vueuse/core"

definePageMeta({
    name: Pages.Groups.name,
})

const user = getAuth().currentUser!
// const itemsPerPage = PageSizes.Groups
const itemLength = ref(0)
const loading = ref(false)
const items = ref([] as Group[])
const route = useRoute()
const search = ref(String(route.query["search"] || ""))
const page = ref(Math.max(((route.query["page"] as any) >>> 0), 1))
const router = useRouter()

const needToReset = ([newSearch]: [string, number], [oldSearch]: [string | undefined, number | undefined]) => {
    if (typeof oldSearch === "undefined") return true
    if (newSearch !== oldSearch) return true
    return false
}

let ignoreUpdates: Function | undefined = undefined
const reset = async () => {
    ignoreUpdates?.(() => page.value = 1)
    itemLength.value = await onCountingGroups({ search: search.value })
}

const stopRenewingQuery = ref<Function>()
const stopLoadingContent = ref<Function>()
onBeforeMount(() => {
    stopRenewingQuery.value = watch([page, search], ([page, search]) => router.push({ query: { page, search } }), { immediate: true, deep: true })
    const watchIgnorableReturn = watchIgnorable([search, page], async (newOne, oldOne) => {
        if (needToReset(newOne, oldOne)) await reset()
        const [search, page] = newOne
        loading.value = true
        items.value = await onListingGroups({ page, search })
        loading.value = false
    }, { immediate: true, deep: true })
    ignoreUpdates = watchIgnorableReturn.ignoreUpdates
    stopLoadingContent.value = watchIgnorableReturn.stop
})
onBeforeUnmount(() => {
    stopRenewingQuery.value?.()
    stopLoadingContent.value?.()
})

const snackbar = useSnackbar()
</script>

<template>
    <v-app>
        <Snackbar ref="snackbar" />
        <v-container>
            <v-app-bar
                image="https://storage.boyholic.com/badminton/assets/banner.jpg">
                <template #append>
                    <v-menu>
                        <template #activator="{ props }">
                            <v-btn icon="mdi-account-circle" v-bind="props" />
                        </template>
                        <v-list>
                            <v-list-item @click="onSigningOut">
                                <template #title> 登出 </template>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template>
            </v-app-bar>
            <v-card class="user">
                <v-card-item>
                    <template v-if="user.photoURL">
                        <v-img :src="user.photoURL">
                            <template #error>
                                <v-icon icon="mdi-account-circle" />
                            </template>
                        </v-img>
                    </template>
                    <template v-else>
                        <v-icon icon="mdi-account-circle" />
                    </template>
                    <v-card-title>
                        <h3>{{ user.displayName }}</h3>
                        <p>管理員</p>
                    </v-card-title>
                </v-card-item>
            </v-card>
            <v-sheet>
                <h3>{{ Pages.Groups.title }}</h3>
                <p>所有可以管理的球團</p>
            </v-sheet>
            <v-row class="groups">
                <template v-for="{ id: groupId, photoURL, name } in items">
                    <v-col class="group">
                        <v-card @click="navigateTo(Pages.Meetups.fullPath({ groupId }))">
                            <v-card-item>
                                <v-img :src="photoURL" />
                            </v-card-item>
                            <v-card-title>
                                {{ name }}
                            </v-card-title>
                            <v-card-text>
                                <p></p>
                            </v-card-text>
                            <v-card-actions>
                                <v-spacer />
                            </v-card-actions>
                        </v-card>
                    </v-col>
                </template>
            </v-row>
        </v-container>
    </v-app>
</template>

<style scoped>
.v-application {
    background: #f0f2f5;
}

.v-container {
    @apply py-0 px-2 mt-6 sm:px-6 bg-white min-h-screen;
    background: #f8f9fa;
}

.v-toolbar {
    position: relative !important;
}

.v-app-bar {
    @apply bg-cover rounded-xl relative overflow-hidden bg-center text-white;
    height: 300px;
}

.v-app-bar :deep(.v-toolbar__image) {
    @apply h-full;
}

.v-app-bar :deep(.v-responsive) {
    padding-bottom: 0 !important;
    @apply relative;
}

.v-app-bar :deep(.v-responsive:after) {
    @apply relative opacity-60 w-full h-full;
    content: '';
    /* background-image: linear-gradient(195deg, #ec407a, #d81b60); */
}

.v-menu .v-list-item {
    min-height: 0 !important;
    @apply leading-5;
}

.v-menu .v-list-item-title {
    @apply text-sm;
}

.user {
    @apply -mt-16 relative;
    z-index: 1005;
    @apply rounded-xl mx-4 sm:mx-6 shadow-md;
}

.user .v-card-item {
    @apply p-4;
}

.user .v-card-title {
    @apply px-4;
}

.user :deep(.v-card-item__content) {
    @apply flex items-center;
}

.user :deep(.v-card-item__content .v-img) {
    width: 74px;
    @apply rounded-lg flex-initial;
}

.v-sheet {
    @apply sm:-mx-2 mt-8 bg-transparent;
}

.groups {
    @apply sm:-mx-4 mt-4;
}

.group {
    @apply flex-initial w-full sm:w-1/2 xl:w-1/3 py-6;
}

.group .v-card {
    @apply overflow-visible cursor-pointer rounded-xl shadow-md;
}

.group .v-card-title {
    @apply overflow-visible px-4;
}

.group :deep(.v-card-item__content) {
    @apply flex items-center overflow-visible;
}

.group :deep(.v-img) {
    width: 74px;
    @apply rounded-lg flex-initial -mt-6;
}
</style>