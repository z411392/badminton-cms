<script lang="ts" setup>
import { type Playlist } from '~/lib/modules/PlaylistManaging/dtos/Playlist'
import { onListingPlaylists } from '~/lib/modules/PlaylistManaging/presentation/controllers/onListingPlaylists'
import { PageSizes } from '~/lib/constants'
import { watchIgnorable } from '@vueuse/core'
import { useAbortController } from '~/composables/utils/useAbortController'

const { groupId } = defineProps<{ groupId: string }>()
const selected = defineModel<Playlist>()
const itemIds = ref<string[]>([])
const itemsMap = ref<{ [playlistId: string]: Playlist }>({})
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
    set: (playlists: Playlist[]) => {
        itemIds.value = []
        itemsMap.value = {}
        for (const playlist of playlists) {
            if (itemsMap.value[playlist.id]) continue
            itemIds.value.push(playlist.id)
            itemsMap.value[playlist.id] = playlist
        }
    }
})

const search = ref("")
const page = ref(1)
const loading = ref(false)
const lastLoaded = ref(0)
const hasMore = computed(() => lastLoaded.value >= PageSizes.Playlists)

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
        const playlists = await onListingPlaylists(groupId, { search, page }, signal)
        items.value = page === 1 ? [...playlists] : [...items.value, ...playlists]
        lastLoaded.value = playlists.length
        loading.value = false
    }, { immediate: true, deep: true })
    ignoreUpdates = watchIgnorableReturn.ignoreUpdates
    stopWatching.value = watchIgnorableReturn.stop
}

const loadMore = () => page.value += 1
const itemTitle = ({ name }: Playlist) => name
const itemValue = ({ id }: Playlist) => id
</script>

<template>
    <v-autocomplete label="播放清單" v-model="selected" v-model:search="search" return-object :item-title="itemTitle"
        :item-value="itemValue" :items="items" chips no-filter variant="underlined" @update:focused="onFocused"
        :loading="loading">
        <template #item="{
            props,
            item: { raw: playlist },
        }: {
            props: any
            item: { raw: Playlist }
        }">
            <v-list-item v-bind="props">
                <template #title>
                    {{ itemTitle(playlist) }}
                </template>
            </v-list-item>
        </template>
        <template v-slot:append-item v-if="!loading && hasMore">
            <div v-intersect="(isIntersecting: boolean) => isIntersecting && loadMore()"></div>
        </template>
    </v-autocomplete>
</template>