import { type Group } from "~/lib/modules/GroupManaging/dtos/Group"
import { translateError } from "~/lib/utils/formatters"
import { showError } from "~/composables/utils/useSnackbar"
import { type CountingGroups } from "~/lib/modules/GroupManaging/presentation/controllers/onCountingGroups"

export type ListingGroups = CountingGroups & {
    page: number
}

export const onListingGroups = async ({ page, search }: ListingGroups) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = "/groups"
    const params = { page }
    try {
        const {
            data: {
                payload: { groups },
            },
        } = await axios.get<{ payload: { groups: Group[] } }>(uri, { params })
        return groups
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
        return []
    }
}
