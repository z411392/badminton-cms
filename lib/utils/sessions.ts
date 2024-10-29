import { useStorage } from "@vueuse/core"
import { Pages } from "~/lib/constants"
import { type Group } from "~/lib/modules/GroupManaging/dtos/Group"
import { type Permission } from "~/lib/modules/IdentityAndAccessManaging/dtos/Permission"
import { PermissionStatuses } from "~/lib/modules/IdentityAndAccessManaging/dtos/PermissionStatuses"
import { type Playlist } from "~/lib/modules/PlaylistManaging/dtos/Playlist"
import { type Meetup } from "~/lib/modules/MeetupManaging/dtos/Meetup"
import { getAuth } from "firebase/auth"

export enum SessionKeys {
    RedirectTo = "redirectTo",
    User = "user",
    Group = "group",
    Permission = "permission",
    Meetup = "meetup",
    Playlist = "playlist",
}

export const withRedirectTo = (setDefaultURL: boolean = false) => {
    return useStorage<string | undefined>(SessionKeys.RedirectTo, setDefaultURL ? Pages.Groups.fullPath() : undefined)
}

export const withUser = () => {
    const auth = getAuth()
    return auth.currentUser!
}

export const withGroup = () => {
    const { data: group } = useNuxtData<Group>(SessionKeys.Group)
    return group as Ref<Group>
}

export const ensureGroupIsSpecified = () => {
    const group = withGroup()
    if (!group.value) return createError({ statusCode: 404, message: `沒有這個球團喔` })
    return group.value
}

export const withPermission = () => {
    const { data: permission } = useNuxtData<Permission>(SessionKeys.Permission)
    return permission as Ref<Permission | undefined>
}

export const ensureUserHasPermission = () => {
    const permission = withPermission()
    if (!permission.value) return createError({ statusCode: 403, message: `沒有權限進行此操作` })
    const { status } = permission.value
    if (status !== PermissionStatuses.Approved) return createError({ statusCode: 403, message: `沒有權限進行此操作` })
    return permission.value
}

export const withPlaylist = () => {
    const { data: playlist } = useNuxtData<Playlist>(SessionKeys.Playlist)
    return playlist as Ref<Playlist>
}

export const ensurePlaylistIsSpecified = () => {
    const playlist = withPlaylist()
    if (!playlist.value) return createError({ statusCode: 404, message: `沒有這個播放清單喔` })
    return playlist.value
}

export const withMeetup = () => {
    const { data: meetup } = useNuxtData<Meetup>(SessionKeys.Meetup)
    return meetup as Ref<Meetup>
}

export const ensureMeetupIsSpecified = () => {
    const meetup = withMeetup()
    if (!meetup.value) return createError({ statusCode: 404, message: `沒有這個球敘喔` })
    return meetup.value
}
