<script lang="ts" setup>
import { Pages } from "~/lib/constants"
import { PageSizes } from "~/lib/constants"
import TrackForm from "~/components/groups/[groupId]/playlists/[playlistId]/tracks/TrackForm.vue"
import { Duration } from "luxon"
import { onRetrievingTrack, type TrackEnriched } from "~/lib/modules/TrackManaging/presentation/controllers/onRetrievingTrack"
import { watchCollection } from "~/lib/utils/firestore"
import { Collections } from "~/lib/constants"
import { getFirestore, collection, query, orderBy } from "@firebase/firestore"
import { WatchTypes } from "~/lib/utils/firestore"
import { onRemovingTracks } from "~/lib/modules/TrackManaging/presentation/controllers/onRemovingTracks"
import { copyTextToClipboard } from "~/lib/utils/ui"
import { showInfo } from "~/composables/utils/useSnackbar"
import { withPlaylist } from "~/lib/utils/sessions"
import { useWindowSize } from "@vueuse/core"

definePageMeta({
    name: Pages.Tracks.name,
})

const itemsPerPage = PageSizes.Tracks
const itemLength = ref(0)
const loading = ref(false)
const route = useRoute()
const { groupId, playlistId } = route.params as { groupId: string, playlistId: string }
const search = ref(String(route.query["search"] || ""))

const onMobile = computed(() => width.value <= 640)

const headers = computed(() => {
    const headers = function* () {
        if (!onMobile.value) yield {
            title: '作品',
            sortable: false,
            key: 'album',
        }
        yield {
            title: '',
            sortable: false,
            key: 'name',
        }
        if (!onMobile.value) yield {
            title: '時長',
            sortable: false,
            key: 'duration',
        }
        yield {
            title: '成員',
            sortable: false,
            key: 'user',
        }
    }
    return Array.from(headers())
})

const trackIds = ref<string[]>([])
const tracksMap = ref<{ [trackId: string]: TrackEnriched }>({})
const stopWatching = ref<Function>()
onBeforeMount(() => {
    const db = getFirestore()
    const q = query(
        collection(
            db,
            Collections.Tracks.replace(":groupId", groupId).replace(":playlistId", playlistId)
        ),
        orderBy("timestamp", "asc"),
    )
    stopWatching.value = watchCollection<{}>(q, async (type, parameters) => {
        const trackId = parameters[parameters.length - 1]
        loading.value = true
        const index = trackIds.value.indexOf(trackId)
        if (type === WatchTypes.Added) {
            if (index >= 0) return
            tracksMap.value[trackId] = await onRetrievingTrack(groupId, playlistId, trackId)
            trackIds.value.push(trackId)
        }
        if (type === WatchTypes.Modified) {
            if (index < 0) return
            tracksMap.value[trackId] = await onRetrievingTrack(groupId, playlistId, trackId)
        }
        if (type === WatchTypes.Removed) {
            if (index < 0) return
            delete tracksMap.value[trackId]
            trackIds.value.splice(index, 1)
        }
        loading.value = false
    }, [WatchTypes.Added, WatchTypes.Modified, WatchTypes.Removed], db)
})

const tracks = computed(() => trackIds.value.map((trackId) => tracksMap.value[trackId]))
const items = computed(() => tracks.value.filter(({ name, artists, album, user }) => {
    if (!search.value) return true
    if (name.includes(search.value)) return true
    for (const { name } of artists) {
        if (name.includes(search.value)) return true
    }
    if (album.name.includes(search.value)) return true
    if (user.displayName.includes(search.value)) return true
    return false
}))

onBeforeUnmount(() => {
    stopWatching.value?.()
})

const form = ref<InstanceType<typeof TrackForm>>() as Ref<InstanceType<typeof TrackForm>>

const durationFor = (millis: number) => {
    const { hours, minutes, seconds } = Duration.fromMillis(millis).shiftTo("hours", "minutes", "seconds")
    return `${("00" + Math.round(hours)).slice(-2)}:${("00" + Math.round(minutes)).slice(-2)}:${("00" + Math.round(seconds)).slice(-2)}`
}

const selected = ref<TrackEnriched[]>([])
const onRemoveButtonClicked = async () => {
    loading.value = true
    const trackIds = selected.value.map(({ id }) => id)
    await onRemovingTracks(groupId, playlistId, trackIds)
    selected.value = []
    loading.value = false
}

const copySpotifyId = (spotifyId: string) => {
    copyTextToClipboard(spotifyId, (soptifyId) => showInfo(`已複製 spotifyId 到剪貼簿`))

}

const { width } = useWindowSize()

const playlist = withPlaylist()
</script>

<template>
    <v-main>
        <TrackForm :groupId="groupId" :playlistId="playlistId" ref="form" />
        <v-container>
            <v-card flat>
                <v-card-title>
                    {{ playlist.name }}（{{ playlist.tracksCount }}）
                </v-card-title>
                <v-card-subtitle>
                    {{ durationFor(playlist.tracksDuration) }}
                </v-card-subtitle>
                <v-card-actions>
                    <v-text-field v-model="search" placeholder="關鍵字" prepend-inner-icon="mdi-magnify"
                        variant="solo-filled" flat hide-details density="compact" single-line />
                </v-card-actions>
                <v-divider />
                <v-data-table-server :items-per-page="itemsPerPage" :headers="headers" :items="items"
                    :items-length="itemLength" :loading="loading" :search="search" item-value="id"
                    disable-items-per-page :page="1" hide-default-footer show-select v-model="selected" return-object>
                    <template v-slot:item.album="{ item: { spotifyId, album: { image } } }: { item: TrackEnriched }">
                        <v-btn @click="copySpotifyId(spotifyId)" variant="plain" height="auto" :ripple="false"
                            density="compact">
                            <template v-if="image">
                                <v-img :src="image" width="96px">
                                    <template #error>
                                        <v-sheet>
                                            無法顯示圖片
                                        </v-sheet>
                                    </template>
                                </v-img>
                            </template>
                            <template v-else>
                                <v-sheet>
                                    無法顯示圖片
                                </v-sheet>
                            </template>
                        </v-btn>
                    </template>
                    <template v-slot:item.name="{ item: { name, artists, preview } }: { item: TrackEnriched }">
                        <v-list flat>
                            <v-list-item>
                                <template #title>
                                    <NuxtLink :to="preview" external target="_blank">
                                        {{ name }}
                                    </NuxtLink>
                                </template>
                                <template #subtitle>
                                    {{ artists.map(({ name }) => name).join(", ") }}
                                </template>
                            </v-list-item>
                        </v-list>
                    </template>
                    <template v-slot:item.duration="{ item: { duration } }: { item: TrackEnriched }">
                        {{ durationFor(duration) }}
                    </template>
                    <template v-slot:item.user="{ item: { duration, user } }: { item: TrackEnriched }">
                        <v-list density="compact">
                            <v-list-item density="compact">
                                <template #prepend>
                                    <v-avatar color="gray" :size="32">
                                        <template v-if="user.photoURL">
                                            <v-img :src="user.photoURL">
                                                <template #error>
                                                    <v-sheet flat>
                                                        {{ user.displayName[0] }}
                                                    </v-sheet>
                                                </template>
                                            </v-img>
                                        </template>
                                        <template v-else>
                                            <v-sheet flat>
                                                {{ user.displayName[0] }}
                                            </v-sheet>
                                        </template>
                                    </v-avatar>
                                </template>
                                <template #title>
                                    {{ user.displayName }}
                                </template>
                            </v-list-item>
                        </v-list>
                    </template>
                </v-data-table-server>
            </v-card>
        </v-container>
    </v-main>
    <template v-if="selected.length">
        <v-btn icon="mdi-trash-can" @click="onRemoveButtonClicked" :class="$style['remove']"></v-btn>
    </template>
    <template v-else>
        <v-btn icon="mdi-plus" @click="form.open()" :class="$style['create']"></v-btn>
    </template>
</template>

<style scoped module>
.create {
    @apply fixed right-4 bottom-4;
}

.remove {
    @apply fixed right-4 bottom-4;
}
</style>

<style scoped>
:deep(.v-list-item-title) {
    white-space: pre-wrap;
}

:deep(.v-list-item-subtitle) {
    white-space: pre-wrap;
}
</style>