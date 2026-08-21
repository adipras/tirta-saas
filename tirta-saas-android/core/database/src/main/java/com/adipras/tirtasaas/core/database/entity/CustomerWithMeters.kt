package com.adipras.tirtasaas.core.database.entity

import androidx.room.Embedded
import androidx.room.Relation

data class CustomerWithMeters(
    @Embedded val customer: CachedCustomerEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "customer_id",
    )
    val meters: List<CachedMeterEntity> = emptyList(),
)
