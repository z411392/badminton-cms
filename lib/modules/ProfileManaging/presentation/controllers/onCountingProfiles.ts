import { translateError } from "~/lib/utils/formatters"
import { showError } from "~/composables/utils/useSnackbar"

export type CountingProfiles = {
    search: string
    levelIds: string[]
}

export const onCountingProfiles = async (groupId: string, { search, levelIds }: CountingProfiles) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/profiles`.replace(":groupId", groupId)
    const params = { search, levelIds }
    try {
        const response = await axios.head(uri, { params })
        const total = parseInt(response.headers["content-length"])
        return total
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
        return 0
    }
}
