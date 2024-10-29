<script lang="ts" setup>
import { type Shuttle } from '~/lib/modules/ShuttleManaging/dtos/Shuttle'
import { onListingShuttles } from '~/lib/modules/ShuttleManaging/presentation/controllers/onListingShuttles'
import { PageSizes } from '~/lib/constants'
import { watchIgnorable } from '@vueuse/core'
import { useAbortController } from '~/composables/utils/useAbortController'
import * as validators from "~/lib/modules/MeetupManaging/presentation/validators/Meetup"

const selected = defineModel<Shuttle[]>()
const itemIds = ref<string[]>([])
const itemsMap = ref<{ [shuttleId: string]: Shuttle }>({})
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
    set: (shuttles: Shuttle[]) => {
        itemIds.value = []
        itemsMap.value = {}
        for (const shuttle of shuttles) {
            if (itemsMap.value[shuttle.id]) continue
            itemIds.value.push(shuttle.id)
            itemsMap.value[shuttle.id] = shuttle
        }
    }
})

const search = ref("")
const page = ref(1)
const loading = ref(false)
const lastLoaded = ref(0)
const hasMore = computed(() => lastLoaded.value >= PageSizes.Shuttles)

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
        const shuttles = await onListingShuttles({ search, page }, signal)
        items.value = page === 1 ? [...shuttles] : [...items.value, ...shuttles]
        lastLoaded.value = shuttles.length
        loading.value = false
    }, { immediate: true, deep: true })
    ignoreUpdates = watchIgnorableReturn.ignoreUpdates
    stopWatching.value = watchIgnorableReturn.stop
}

const loadMore = () => page.value += 1
const itemTitle = ({ brand, name }: Shuttle) => `${brand} ${name}`
const itemValue = ({ id }: Shuttle) => id

const rules = [
    (shuttles: Shuttle[]) => {
        const { error } = validators.shuttleIds.validate(shuttles.map(({ id }) => id))
        if (error) return error.message
        return true
    }
]
</script>

<template>
    <v-autocomplete label="用球" v-model="selected" v-model:search="search" return-object :item-title="itemTitle"
        :item-value="itemValue" :items="items" chips no-filter variant="underlined" multiple @update:focused="onFocused"
        :loading="loading" :rules="rules">
        <template #item="{
            props,
            item: { raw: shuttle },
        }: {
            props: any
            item: { raw: Shuttle }
        }">
            <v-list-item v-bind="props">
                <template #title>
                    {{ itemTitle(shuttle) }}
                </template>
            </v-list-item>
        </template>
        <template v-slot:append-item v-if="!loading && hasMore">
            <div v-intersect="(isIntersecting: boolean) => isIntersecting && loadMore()"></div>
        </template>
    </v-autocomplete>
</template>