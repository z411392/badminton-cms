import { SessionKeys } from "~/lib/utils/sessions"
import { type Playlist } from "~/lib/modules/PlaylistManaging/dtos/Playlist"
import { onRetrievingPlaylist } from "~/lib/modules/PlaylistManaging/presentation/controllers/onRetrievingPlaylist"

export const withPlaylistResolving = async (groupId: string, playlistId: string) => {
    const { data } = useNuxtData(SessionKeys.Playlist) as { data: Ref<Playlist> }
    const playlist = await onRetrievingPlaylist(groupId, playlistId)
    if (!playlist) return
    data.value = playlist
}
