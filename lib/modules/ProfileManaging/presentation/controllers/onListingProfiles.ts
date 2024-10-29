import { type Profile } from "~/lib/modules/ProfileManaging/dtos/Profile"
import { translateError } from "~/lib/utils/formatters"
import { showError } from "~/composables/utils/useSnackbar"
import { type CountingProfiles } from "~/lib/modules/ProfileManaging/presentation/controllers/onCountingProfiles"
import { type User } from "~/lib/modules/IdentityAndAccessManaging/dtos/User"

export type ListingProfiles = CountingProfiles & {
    page: number
    levelIds: string[]
}

export type ProfileEnriched = Profile & { user: User }

export const onListingProfiles = async (groupId: string, { page, search, levelIds }: ListingProfiles) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/profiles`.replace(":groupId", groupId)
    const params = { page, search, levelIds }
    try {
        const {
            data: {
                payload: { profiles, usersMap },
            },
        } = await axios.get<{
            payload: {
                profiles: Profile[]
                usersMap: { [userId: string]: User }
            }
        }>(uri, { params })
        return profiles.map(({ userId, ...profile }) => {
            const user = usersMap[userId]
            return {
                ...profile,
                userId,
                user,
            }
        })
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
        return []
    }
}
