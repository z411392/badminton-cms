export type PageMeta = {
    name: string
    title: string
    fullPath: (parmas?: any) => string
}

export const Pages: { [pageName: string]: PageMeta } = {
    SignIn: {
        name: "auth-signIn",
        title: "使用者登入",
        fullPath: () => "/auth/signIn",
    },
    Groups: {
        name: "groups",
        title: "選擇球團",
        fullPath: () => "/",
    },
    Dashboard: {
        name: "groups-groupId",
        title: "導覽頁",
        fullPath: ({ groupId }: { groupId: string }) => "/groups/:groupId".replace(":groupId", groupId),
    },
    Meetups: {
        name: "groups-groupId-meetups-index",
        title: "開團",
        fullPath: ({ groupId }: { groupId: string }) => "/groups/:groupId/meetups".replace(":groupId", groupId),
    },
    Venues: {
        name: "groups-groupId-venues-index",
        title: "場地",
        fullPath: ({ groupId }: { groupId: string }) => "/groups/:groupId/venues".replace(":groupId", groupId),
    },
    Shuttles: {
        name: "groups-groupId-shuttles-index",
        title: "用球",
        fullPath: ({ groupId }: { groupId: string }) => "/groups/:groupId/shuttles".replace(":groupId", groupId),
    },
    Profiles: {
        name: "groups-groupId-profiles-index",
        title: "成員",
        fullPath: ({ groupId }: { groupId: string }) => "/groups/:groupId/profiles".replace(":groupId", groupId),
    },
    Levels: {
        name: "groups-groupId-levels-index",
        title: "分級",
        fullPath: ({ groupId }: { groupId: string }) => "/groups/:groupId/levels".replace(":groupId", groupId),
    },
    Tags: {
        name: "groups-groupId-tags-index",
        title: "標籤",
        fullPath: ({ groupId }: { groupId: string }) => "/groups/:groupId/tags".replace(":groupId", groupId),
    },
    SignUps: {
        name: "groups-groupId-meetups-meetupId-signUps-index",
        title: "報名",
        fullPath: ({ groupId, meetupId }: { groupId: string; meetupId: string }) =>
            "/groups/:groupId/meetups/:meetupId/signUps".replace(":groupId", groupId).replace(":meetupId", meetupId),
    },
    Playlists: {
        name: "groups-groupId-playlists-index",
        title: "播放清單",
        fullPath: ({ groupId }: { groupId: string }) => "/groups/:groupId/playlists".replace(":groupId", groupId),
    },
    Tracks: {
        name: "groups-groupId-playlists-playlistId-tracks-index",
        title: "點播",
        fullPath: ({ groupId, playlistId }: { groupId: string; playlistId: string }) =>
            "/groups/:groupId/playlists/:playlistId/tracks"
                .replace(":groupId", groupId)
                .replace(":playlistId", playlistId),
    },
}

export enum DatetimeFormats {
    ISO8601DATE = "yyyy-LL-dd",
    ISO8601TIME = "HH:mm:ss",
    ISO8601 = `${DatetimeFormats.ISO8601DATE} ${DatetimeFormats.ISO8601TIME}`,
}

export enum PageSizes {
    Unlimited = 2000,
    Venues = 20,
    Shuttles = 20,
    Tags = 20,
    Meetups = 20,
    Playlists = 20,
    Tracks = 20,
    Profiles = 20,
}

export const emptyPlaceholder = "-"

export const Root = "wT9yf3fvduNaALoB5PKPDMQVrNZ2"

export const Collections = new Proxy(
    {
        Tracks: `groups/:groupId/playlists/:playlistId/tracks`,
        SignUps: `groups/:groupId/meetups/:meetupId/timeslots/:timeslotId/signUps`,
        MeetupEvents: `groups/:groupId/meetups/:meetupId/events`,
        Profiles: "groups/:groupId/profiles",
    },
    {
        get: (props, prop) => {
            const collection = props[prop as keyof typeof props]
            if (!collection) return undefined
            return process.env.NODE_ENV && process.env.NODE_ENV !== "production"
                ? [process.env.NODE_ENV, collection].join("_")
                : collection
        },
    },
)

export enum Topics {
    SignUp = "SignUp",
}

export const EventsSavedTo = {
    [Topics.SignUp]: Collections.MeetupEvents,
}
