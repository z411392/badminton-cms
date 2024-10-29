<script lang="ts" setup>
import { Pages } from "~/lib/constants"
import { PageSizes } from "~/lib/constants"
import TracksAddingForm from "~/components/groups/[groupId]/playlists/[playlistId]/tracks/TracksAddingForm.vue"
import { Duration } from "luxon"
import { type TrackEnriched } from "~/lib/modules/TrackManaging/presentation/controllers/onRetrievingTrack"
import { onRemovingTracks } from "~/lib/modules/TrackManaging/presentation/controllers/onRemovingTracks"
import { copyTextToClipboard } from "~/lib/utils/ui"
import { showSuccess } from "~/composables/utils/useSnackbar"
import { withPlaylist } from "~/lib/utils/sessions"
import { useTracks } from "~/composables/groups/[groupId]/playlists/[playlistId]/tracks/useTracks"
import { onRetrievingPlaylist } from "~/lib/modules/PlaylistManaging/presentation/controllers/onRetrievingPlaylist"

definePageMeta({
    name: Pages.Tracks.name,
})

const itemsPerPage = PageSizes.Unlimited
const itemLength = ref(0)
const loading = ref(false)
const route = useRoute()
const { groupId, playlistId } = route.params as { groupId: string, playlistId: string }
const search = ref(String(route.query["search"] || ""))

const headers = computed(() => {
    const headers = function* () {
        yield {
            title: '',
            sortable: false,
            key: 'album',
            width: '72px'
        }
        yield {
            title: '',
            sortable: false,
            key: 'name',
        }
        yield {
            title: '成員',
            sortable: false,
            key: 'user',
            width: '240px',
        }
    }
    return Array.from(headers())
})

const onChanged = async (trackId: string) => playlist.value = (await onRetrievingPlaylist(groupId, playlistId))!
const { tracks } = useTracks({ groupId, playlistId }, onChanged)

const items = computed(() => tracks.value.filter((track) => {
    if (!search.value) return true
    const { name, artists, album, user } = track
    if (name.includes(search.value)) return true
    for (const { name } of artists) {
        if (name.includes(search.value)) return true
    }
    if (album.name.includes(search.value)) return true
    if (user.displayName.includes(search.value)) return true
    return false
}))

const form = ref<InstanceType<typeof TracksAddingForm>>() as Ref<InstanceType<typeof TracksAddingForm>>

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

const playlist = withPlaylist()
const copyPlaylistURL = (spotifyId: string) => {
    copyTextToClipboard(`https://open.spotify.com/playlist/${spotifyId}`, () => showSuccess(`已複製連結至剪貼簿`))
}
</script>

<template>
    <TracksAddingForm :groupId="groupId" :playlistId="playlistId" ref="form" />
    <v-container>
        <v-card flat>
            <v-card-title>
                <a style="cursor:pointer;" @click="() => copyPlaylistURL(playlist.spotifyId)">
                    {{ playlist.name }}（{{ playlist.tracksCount }}）
                </a>
            </v-card-title>
            <v-card-subtitle>
                {{ durationFor(playlist.tracksDuration) }}
            </v-card-subtitle>
            <v-card-actions>
                <v-text-field v-model="search" placeholder="關鍵字" prepend-inner-icon="mdi-magnify" variant="solo-filled"
                    flat hide-details density="compact" single-line />
            </v-card-actions>
            <v-divider />
            <v-data-table-server :items-per-page="itemsPerPage" :headers="headers" :items="items"
                :items-length="itemLength" :loading="loading" :search="search" item-value="id" disable-items-per-page
                :page="1" hide-default-footer show-select v-model="selected" return-object>
                <template v-slot:item.album="{ item: { album: { image }, preview } }: { item: TrackEnriched }">
                    <NuxtLink :to="preview" target="_blank" external>
                        <template v-if="image">
                            <v-img :src="image" cover>
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
                    </NuxtLink>
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
                <template v-slot:item.user="{ item: { user } }: { item: TrackEnriched }">
                    <v-list density="compact">
                        <v-list-item density="compact">
                            <template #prepend>
                                <v-avatar color="gray" :size="40">
                                    <template v-if="user.photoURL">
                                        <v-img :src="user.photoURL">
                                            <template #error>
                                                <v-sheet style="line-height: 40px;">
                                                    {{ user.displayName.charAt(0) }}
                                                </v-sheet>
                                            </template>
                                        </v-img>
                                    </template>
                                    <template v-else>
                                        <v-sheet style="line-height: 40px;">
                                            {{ user.displayName.charAt(0) }}
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

:deep(table) {
    table-layout: fixed;
    min-width: 640px;
}
</style>