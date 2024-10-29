import { translateError } from "~/lib/utils/formatters"
import { showError } from "~/composables/utils/useSnackbar"

export type CountingShuttles = {
    search: string
}

export const onCountingShuttles = async ({ search }: CountingShuttles) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/shuttles`
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
