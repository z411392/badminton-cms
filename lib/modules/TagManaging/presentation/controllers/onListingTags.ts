import { type Tag } from "~/lib/modules/TagManaging/dtos/Tag"
import { translateError } from "~/lib/utils/formatters"
import { showError } from "~/composables/utils/useSnackbar"
import { type CountingTags } from "~/lib/modules/TagManaging/presentation/controllers/onCountingTags"

export type ListingTags = CountingTags & {
    page: number
}

export const onListingTags = async (groupId: string, { page, search }: ListingTags) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/tags`.replace(":groupId", groupId)
    const params = { page, search }
    try {
        const {
            data: {
                payload: { tags },
            },
        } = await axios.get<{ payload: { tags: Tag[] } }>(uri, { params })
        return tags
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
        return []
    }
}
