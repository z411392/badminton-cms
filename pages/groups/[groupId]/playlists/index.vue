<script lang="ts" setup>
import { Pages } from "~/lib/constants"
import { onCountingPlaylists } from "~/lib/modules/PlaylistManaging/presentation/controllers/onCountingPlaylists"
import { PageSizes } from "~/lib/constants"
import { type Playlist } from "~/lib/modules/PlaylistManaging/dtos/Playlist"
import { onListingPlaylists } from "~/lib/modules/PlaylistManaging/presentation/controllers/onListingPlaylists"
import PlaylistForm from "~/components/groups/[groupId]/playlists/PlaylistForm.vue"
import { performConfirm } from "~/composables/utils/useConfirm"
import { onRemovingPlaylist } from "~/lib/modules/PlaylistManaging/presentation/controllers/onRemovingPlaylist"
import { watchIgnorable } from "@vueuse/core"
import { Duration } from "luxon"
import { copyTextToClipboard } from "~/lib/utils/ui"
import { showSuccess } from "~/composables/utils/useSnackbar"

definePageMeta({
  name: Pages.Playlists.name,
})

const itemsPerPage = PageSizes.Playlists
const itemLength = ref(0)
const loading = ref(false)
const items = ref([] as Playlist[])
const route = useRoute()
const { groupId } = route.params as { groupId: string }
const search = ref(String(route.query["search"] || ""))
const page = ref(Math.max(((route.query["page"] as any) >>> 0), 1))
const router = useRouter()

const headers = [
  {
    title: '播放清單',
    sortable: false,
    key: 'name',
  },
  {
    title: '總點播數',
    sortable: false,
    key: 'count',
  },
  {
    title: '總時長',
    sortable: false,
    key: 'duration',
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
  itemLength.value = await onCountingPlaylists(groupId, { search: search.value })
}

const stopRenewingQuery = ref<Function>()
const stopLoadingContent = ref<Function>()
onBeforeMount(() => {
  stopRenewingQuery.value = watch([page, search], ([page, search]) => router.push({ query: { page, search } }), { immediate: true, deep: true })
  const watchIgnorableReturn = watchIgnorable([search, page], async (newOne, oldOne) => {
    if (needToReset(newOne, oldOne)) await reset()
    const [search, page] = newOne
    loading.value = true
    items.value = await onListingPlaylists(groupId, { page, search })
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
const form = ref<InstanceType<typeof PlaylistForm>>() as Ref<InstanceType<typeof PlaylistForm>>
const onDeleteButtonClicked = (playlistId: string) => performConfirm(
  `刪除播放清單`,
  `確定要刪除嗎？`,
  async () => {
    await onRemovingPlaylist(groupId, playlistId)
    reload()
  },
)

const durationFor = (millis: number) => {
  const { hours, minutes, seconds } = Duration.fromMillis(millis).shiftTo("hours", "minutes", "seconds")
  return `${("00" + Math.round(hours)).slice(-2)}:${("00" + Math.round(minutes)).slice(-2)}:${("00" + Math.round(seconds)).slice(-2)}`
}

const copyPlaylistURL = (spotifyId: string) => {
  copyTextToClipboard(`https://open.spotify.com/playlist/${spotifyId}`, () => showSuccess(`已複製連結至剪貼簿`))
}
</script>

<template>
  <PlaylistForm :groupId="groupId" :reload="reload" ref="form" />
  <v-container>
    <v-card flat>
      <v-card-title>
        <v-spacer />
        <v-text-field v-model="search" placeholder="關鍵字" prepend-inner-icon="mdi-magnify" variant="solo-filled" flat
          hide-details density="compact" single-line />
      </v-card-title>
      <v-divider />
      <v-data-table-server :items-per-page="itemsPerPage" :headers="headers" :items="items" :items-length="itemLength"
        :loading="loading" :search="search" item-value="id" @update:options="onOptionsUpdated" disable-items-per-page
        :page="page">
        <template v-slot:item.name="{ item: { name, id: playlistId } }: { item: Playlist }">
          <v-btn variant="plain" flat :to="Pages.Tracks.fullPath({ groupId, playlistId })">
            {{ name }}
          </v-btn>
        </template>
        <template v-slot:item.count="{
          item: { tracksCount, tracksDuration },
        }: {
          item: Playlist,
            }">
          {{ tracksCount }}
        </template>
        <template v-slot:item.duration="{
          item: { tracksCount, tracksDuration },
        }: {
          item: Playlist,
            }">
          {{ durationFor(tracksDuration) }}
        </template>
        <template v-slot:item.ops="{ item: playlist }: { item: Playlist }">
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props"></v-btn>
            </template>
            <v-list>
              <v-list-item @click="form.open(playlist)">
                <template #title>編輯</template>
              </v-list-item>
              <v-list-item @click="() => onDeleteButtonClicked(playlist.id)">
                <template #title>刪除</template>
              </v-list-item>
              <v-list-item @click="() => copyPlaylistURL(playlist.spotifyId)">
                <template #title>取得連結</template>
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
