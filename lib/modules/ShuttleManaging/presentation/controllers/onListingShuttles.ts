import { type Shuttle } from "~/lib/modules/ShuttleManaging/dtos/Shuttle"
import { translateError } from "~/lib/utils/formatters"
import { showError } from "~/composables/utils/useSnackbar"
import { type CountingShuttles } from "~/lib/modules/ShuttleManaging/presentation/controllers/onCountingShuttles"
import { isCancel } from "axios"

export type ListingShuttles = CountingShuttles & {
    page: number
}

export const onListingShuttles = async ({ page, search }: ListingShuttles, signal?: AbortController["signal"]) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = "/shuttles"
    const params = { page, search }
    try {
        const {
            data: {
                payload: { shuttles },
            },
        } = await axios.get<{ payload: { shuttles: Shuttle[] } }>(uri, { params })
        return shuttles
    } catch (thrown) {
        if (isCancel(thrown)) return []
        const error = translateError(thrown)
        if (error) showError(error.message)
        return []
    }
}
