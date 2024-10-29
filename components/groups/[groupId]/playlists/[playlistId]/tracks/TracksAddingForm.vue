<script lang="ts" setup>
import { type Artist } from "~/lib/modules/SongRequesting/presentation/controllers/onSearchingArtists"
import ArtistAutoComplete from "~/components/groups/[groupId]/playlists/[playlistId]/tracks/ArtistAutoComplete.vue"
import { type Track } from "~/lib/modules/SongRequesting/presentation/controllers/onSearchingTracks"
import TracksInfiniteScroll from "~/components/groups/[groupId]/playlists/[playlistId]/tracks//TracksInfiniteScroll.vue"
import { onManaullyAddingTracks } from "~/lib/modules/TrackManaging/presentation/controllers/onManaullyAddingTracks"

const { groupId, playlistId } = defineProps<{ groupId: string, playlistId: string }>()

const opened = ref(false)
const title = ref("")

const artist = ref<Artist>()
const artistName = computed(() => artist.value ? artist.value.name : "")
const tracks = ref<Track[]>([])
const spotifyIds = computed(() => tracks.value.map(({ id }) => id))
const loading = ref(false)

const onSaveButtonClicked = async () => {
    loading.value = true
    await onManaullyAddingTracks(groupId, playlistId, unref(mutation))
    loading.value = false
    artist.value = undefined
    search.value = ""
    tracksInfiniteScroll.value.flush(true)
    close()
}

const mutation = computed(() => {
    return {
        spotifyIds: spotifyIds.value,
    }
})

const open = async () => {
    opened.value = true
    title.value = "新增點播"
}

const close = () => {
    opened.value = false
}

onBeforeUnmount(() => close())

defineExpose({
    open,
})

const search = ref("")

const tracksInfiniteScroll = ref() as Ref<InstanceType<typeof TracksInfiniteScroll>>
</script>

<template>
    <v-dialog v-model="opened" :width="360">
        <v-card :loading="loading">
            <v-card-title>
                {{ title }}
            </v-card-title>
            <v-card-text>
                <v-form @submit.prevent="">
                    <v-container dense>
                        <v-row dense>
                            <v-col dense :cols="12">
                                <ArtistAutoComplete v-model="artist" />
                            </v-col dense>
                            <v-col dense :cols="12">
                                <TracksInfiniteScroll ref="tracksInfiniteScroll" v-model:search="search"
                                    v-model="tracks" v-model:artist="artistName" />
                            </v-col>
                        </v-row>
                    </v-container>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text="取消" @click="close" :disabled="loading" />
                <v-btn text="儲存" @click="onSaveButtonClicked" :disabled="spotifyIds.length === 0" :loading="loading" />
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>