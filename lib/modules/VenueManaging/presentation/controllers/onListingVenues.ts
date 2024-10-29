import { type Venue } from "~/lib/modules/VenueManaging/dtos/Venue"
import { translateError } from "~/lib/utils/formatters"
import { showError } from "~/composables/utils/useSnackbar"
import { type CountingVenues } from "~/lib/modules/VenueManaging/presentation/controllers/onCountingVenues"
import { isCancel } from "axios"

export type ListingVenues = CountingVenues & {
    page: number
}

export const onListingVenues = async ({ page, search }: ListingVenues, signal?: AbortController["signal"]) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = "/venues"
    const params = { page, search }
    try {
        const {
            data: {
                payload: { venues },
            },
        } = await axios.get<{ payload: { venues: Venue[] } }>(uri, { params, signal })
        return venues
    } catch (thrown) {
        if (isCancel(thrown)) return []
        const error = translateError(thrown)
        if (error) showError(error.message)
        return []
    }
}
