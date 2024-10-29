<script lang="ts" setup>
import { type Venue } from '~/lib/modules/VenueManaging/dtos/Venue'
import { onListingVenues } from '~/lib/modules/VenueManaging/presentation/controllers/onListingVenues'
import { PageSizes } from '~/lib/constants'
import { watchIgnorable } from '@vueuse/core'
import { useAbortController } from '~/composables/utils/useAbortController'
import * as validators from "~/lib/modules/MeetupManaging/presentation/validators/Meetup"

const selected = defineModel<Venue>()
const itemIds = ref<string[]>([])
const itemsMap = ref<{ [venueId: string]: Venue }>({})
const items = computed({
    get: () => {
        const items = []
        for (const itemId of itemIds.value) {
            const item = itemsMap.value[itemId]
            if (!item) continue
            items.push(item)
        }
        return items
    },
    set: (venues: Venue[]) => {
        itemIds.value = []
        itemsMap.value = {}
        for (const venue of venues) {
            if (itemsMap.value[venue.id]) continue
            itemIds.value.push(venue.id)
            itemsMap.value[venue.id] = venue
        }
    }
})

const search = ref("")
const page = ref(1)
const loading = ref(false)
const lastLoaded = ref(0)
const hasMore = computed(() => lastLoaded.value >= PageSizes.Venues)

const abortController = useAbortController()

const needToReset = ([newSearch]: [string, number], [oldSearch]: [string | undefined, number | undefined]) => {
    if (typeof oldSearch === "undefined") return true
    if (newSearch !== oldSearch) return true
    return false
}

let ignoreUpdates: Function
const reset = () => {
    abortController.cancel()
    ignoreUpdates?.(() => page.value = 1)
}

const stopWatching = ref<Function>()
const onFocused = async (focused: boolean) => {
    if (!focused) {
        stopWatching.value?.()
        abortController.clear()
        search.value = ""
        page.value = 1
        return
    }
    const watchIgnorableReturn = watchIgnorable([search, page], async (newOne, oldOne) => {
        if (needToReset(newOne, oldOne)) reset()
        const [search, page] = newOne
        const signal = abortController.signal({ search, page })
        loading.value = true
        const venues = await onListingVenues({ search, page }, signal)
        items.value = page === 1 ? [...venues] : [...items.value, ...venues]
        lastLoaded.value = venues.length
        loading.value = false
    }, { immediate: true, deep: true })
    ignoreUpdates = watchIgnorableReturn.ignoreUpdates
    stopWatching.value = watchIgnorableReturn.stop
}

const loadMore = () => page.value += 1
const itemTitle = ({ name }: Venue) => name
const itemValue = ({ id }: Venue) => id

const rules = [
    (venue: Venue | null) => {
        const { error } = validators.venueId.validate(venue ? venue.id : undefined)
        if (error) return error.message
        return true
    }
]
</script>

<template>
    <v-autocomplete label="場地" v-model="selected" v-model:search="search" return-object :item-title="itemTitle"
        :item-value="itemValue" :items="items" chips no-filter variant="underlined" @update:focused="onFocused"
        :loading="loading" :rules="rules">
        <template #item="{
            props,
            item: { raw: venue },
        }: {
            props: any
            item: { raw: Venue }
        }">
            <v-list-item v-bind="props">
                <template #title>
                    {{ itemTitle(venue) }}
                </template>
            </v-list-item>
        </template>
        <template v-slot:append-item v-if="!loading && hasMore">
            <div v-intersect="(isIntersecting: boolean) => isIntersecting && loadMore()"></div>
        </template>
    </v-autocomplete>
</template>