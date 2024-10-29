<script lang="ts" setup>
import { Pages } from "~/lib/constants"
import { onCountingVenues } from "~/lib/modules/VenueManaging/presentation/controllers/onCountingVenues"
import { PageSizes } from "~/lib/constants"
import { onListingVenues } from "~/lib/modules/VenueManaging/presentation/controllers/onListingVenues"
import { type Venue } from "~/lib/modules/VenueManaging/dtos/Venue"
import VenueForm from "~/components/groups/[groupId]/venues/VenueForm.vue"
import { performConfirm } from "~/composables/utils/useConfirm"
import { onRemovingVenue } from "~/lib/modules/VenueManaging/presentation/controllers/onRemovingVenue"
import { watchIgnorable } from "@vueuse/core"

definePageMeta({
    name: Pages.Venues.name,
})

const itemsPerPage = PageSizes.Venues
const itemLength = ref(0)
const loading = ref(false)
const items = ref([] as Venue[])
const route = useRoute()
const search = ref(String(route.query["search"] || ""))
const page = ref(Math.max(((route.query["page"] as any) >>> 0), 1))
const router = useRouter()

const headers = [
    {
        title: '場地',
        sortable: false,
        key: 'name',
    },
    {
        title: '',
        sortable: false,
        key: 'ops',
        align: 'end' as 'end',
    },
]

const needToReset = ([newSearch]: [string, number], [oldSearch]: [string | undefined, number | undefined]) => {
    if (typeof oldSearch === "undefined") return true
    if (newSearch !== oldSearch) return true
    return false
}

let ignoreUpdates: Function | undefined = undefined
const reset = async () => {
    ignoreUpdates?.(() => page.value = 1)
    itemLength.value = await onCountingVenues({ search: search.value })
}

const stopRenewingQuery = ref<Function>()
const stopLoadingContent = ref<Function>()
onBeforeMount(() => {
    stopRenewingQuery.value = watch([page, search], ([page, search]) => router.push({ query: { page, search } }), { immediate: true, deep: true })
    const watchIgnorableReturn = watchIgnorable([search, page], async (newOne, oldOne) => {
        if (needToReset(newOne, oldOne)) await reset()
        const [search, page] = newOne
        loading.value = true
        items.value = await onListingVenues({ page, search })
        loading.value = false
    }, { immediate: true, deep: true })
    ignoreUpdates = watchIgnorableReturn.ignoreUpdates
    stopLoadingContent.value = watchIgnorableReturn.stop
})
onBeforeUnmount(() => {
    stopRenewingQuery.value?.()
    stopLoadingContent.value?.()
})

const onOptionsUpdated = async (options: { page: number }) => {
    page.value = options.page
}

const reload = () => triggerRef(page)

const form = ref<InstanceType<typeof VenueForm>>() as Ref<InstanceType<typeof VenueForm>>
const onDeleteButtonClicked = (venueId: string) => performConfirm(
    `刪除場地`,
    `確定要刪除嗎？`,
    async () => {
        await onRemovingVenue(venueId)
        reload()
    },
)
</script>

<template>
    <VenueForm :reload="reload" ref="form" />
    <v-container>
        <v-card flat>
            <v-card-actions>
                <v-text-field v-model="search" placeholder="關鍵字" prepend-inner-icon="mdi-magnify" variant="solo-filled"
                    flat hide-details density="compact" single-line />
            </v-card-actions>
            <v-divider />
            <v-data-table-server :items-per-page="itemsPerPage" :headers="headers" :items="items"
                :items-length="itemLength" :loading="loading" :search="search" item-value="id"
                @update:options="onOptionsUpdated" disable-items-per-page :page="page">
                <template v-slot:item.ops="{ item: venue }: { item: Venue }">
                    <v-menu>
                        <template v-slot:activator="{ props }">
                            <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props"></v-btn>
                        </template>
                        <v-list>
                            <v-list-item @click="form.open(venue)">
                                <template #title>編輯</template>
                            </v-list-item>
                            <v-list-item @click="() => onDeleteButtonClicked(venue.id)">
                                <template #title>刪除</template>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template>
            </v-data-table-server>
        </v-card>
    </v-container>
    <v-btn icon="mdi-plus" @click="form.open()" :class="$style['create']"></v-btn>
</template>

<style scoped module>
.create {
    @apply fixed right-4 bottom-4;
}
</style>