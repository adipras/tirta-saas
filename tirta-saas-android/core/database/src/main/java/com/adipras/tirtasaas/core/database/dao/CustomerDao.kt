package com.adipras.tirtasaas.core.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import com.adipras.tirtasaas.core.database.entity.CachedCustomerEntity
import com.adipras.tirtasaas.core.database.entity.CachedMeterEntity
import com.adipras.tirtasaas.core.database.entity.CustomerWithMeters
import kotlinx.coroutines.flow.Flow

@Dao
interface CustomerDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCustomers(customers: List<CachedCustomerEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMeters(meters: List<CachedMeterEntity>)

    @Transaction
    suspend fun upsertCustomerWithMeters(
        customer: CachedCustomerEntity,
        meters: List<CachedMeterEntity>,
    ) {
        insertCustomers(listOf(customer))
        deleteMetersForCustomer(customer.id)
        insertMeters(meters)
    }

    @Transaction
    suspend fun upsertCustomersWithMeters(
        customers: List<CachedCustomerEntity>,
        meters: List<CachedMeterEntity>,
    ) {
        insertCustomers(customers)
        insertMeters(meters)
    }

    @Query("DELETE FROM cached_meters WHERE customer_id = :customerId")
    suspend fun deleteMetersForCustomer(customerId: String)

    @Transaction
    @Query("SELECT * FROM cached_customers ORDER BY name ASC")
    fun getAllCustomersFlow(): Flow<List<CustomerWithMeters>>

    @Transaction
    @Query("SELECT * FROM cached_customers ORDER BY name ASC")
    suspend fun getAllCustomers(): List<CustomerWithMeters>

    @Transaction
    @Query("SELECT * FROM cached_customers WHERE id = :customerId LIMIT 1")
    suspend fun getCustomerById(customerId: String): CustomerWithMeters?

    @Transaction
    @Query("""
        SELECT DISTINCT c.* FROM cached_customers c
        LEFT JOIN cached_meters m ON c.id = m.customer_id
        WHERE c.name LIKE '%' || :query || '%'
           OR c.address LIKE '%' || :query || '%'
           OR c.phone LIKE '%' || :query || '%'
           OR m.meter_number LIKE '%' || :query || '%'
        ORDER BY c.name ASC
        LIMIT :limit
    """)
    suspend fun searchCustomers(query: String, limit: Int = 20): List<CustomerWithMeters>

    @Query("SELECT * FROM cached_meters WHERE customer_id = :customerId AND status = 'active'")
    suspend fun getActiveMetersByCustomerId(customerId: String): List<CachedMeterEntity>

    @Query("SELECT * FROM cached_meters WHERE id = :meterId LIMIT 1")
    suspend fun getMeterById(meterId: String): CachedMeterEntity?

    @Query("DELETE FROM cached_customers")
    suspend fun clearAll()
}
