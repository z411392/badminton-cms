import { translateError } from "~/lib/utils/formatters"
import { showError } from "~/composables/utils/useSnackbar"

export type CountingMeetups = {
    search: string
}

export const onCountingMeetups = async (groupId: string, { search }: CountingMeetups) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/meetups`.replace(":groupId", groupId)
    const params = { search }
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
