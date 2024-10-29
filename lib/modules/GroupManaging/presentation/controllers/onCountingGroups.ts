import { translateError } from "~/lib/utils/formatters"
import { showError } from "~/composables/utils/useSnackbar"

export type CountingGroups = {
    search: string
}

export const onCountingGroups = async ({ search }: CountingGroups) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups`
    try {
        const response = await axios.head(uri)
        return parseInt(response.headers["content-length"])
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
        return 0
    }
}
