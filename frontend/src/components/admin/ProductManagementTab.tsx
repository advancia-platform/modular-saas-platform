"use client";

import React, { useState, useMemo } from "react";

const ProductManagementTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Mock product data - replace with actual API calls
  const products = useMemo(
    () => [
      {
        id: 1,
        name: "Recovery Session Package",
        description:
          "Comprehensive recovery session with advanced therapeutic protocols.",
        category: "recovery_packages",
        price: 299.99,
        status: "active",
        inventory: 15,
        likes: 234,
        sales: 89,
        createdDate: "2024-08-15",
        lastUpdated: "2024-10-01",
      },
      {
        id: 2,
        name: "Enhancement Program",
        description:
          "Advanced enhancement program for optimal wellness and performance.",
        category: "enhancement_programs",
        price: 499.99,
        status: "active",
        inventory: 32,
        likes: 156,
        sales: 145,
        createdDate: "2024-07-22",
        lastUpdated: "2024-09-28",
      },
      {
        id: 3,
        name: "Diagnostic Package",
        description:
          "Comprehensive diagnostic assessment with detailed analysis.",
        category: "diagnostic_services",
        price: 199.99,
        status: "active",
        inventory: 8,
        likes: 98,
        sales: 67,
        createdDate: "2024-09-05",
        lastUpdated: "2024-10-02",
      },
    ],
    []
  );

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "recovery_packages", label: "Recovery Packages" },
    { value: "enhancement_programs", label: "Enhancement Programs" },
    { value: "diagnostic_services", label: "Diagnostic Services" },
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "draft", label: "Draft" },
    { value: "inactive", label: "Inactive" },
  ];

  const sortOptions = [
    { value: "created_date", label: "Created Date" },
    { value: "name", label: "Name" },
    { value: "price", label: "Price" },
    { value: "sales", label: "Sales" },
    { value: "likes", label: "Likes" },
  ];

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" || product.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    return filtered.sort((a, b) => {
      let aValue: string | number | Date = a[sortBy as keyof typeof a] as
        | string
        | number;
      let bValue: string | number | Date = b[sortBy as keyof typeof b] as
        | string
        | number;

      if (sortBy === "created_date" || sortBy === "lastUpdated") {
        aValue = new Date(aValue as string);
        bValue = new Date(bValue as string);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [searchTerm, categoryFilter, statusFilter, sortBy, sortOrder, products]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", label: "Active" },
      draft: { color: "bg-yellow-100 text-yellow-800", label: "Draft" },
      inactive: { color: "bg-gray-100 text-gray-800", label: "Inactive" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.inactive;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      recovery_packages: "Recovery Packages",
      enhancement_programs: "Enhancement Programs",
      diagnostic_services: "Diagnostic Services",
    };
    return categoryMap[category] || category;
  };

  const handleStatusChange = (productId: number, newStatus: string) => {
    console.log(`Changing product ${productId} status to ${newStatus}`);
    // TODO: Implement API call to update product status
  };

  const handleDeleteProduct = (productId: number) => {
    console.log(`Deleting product ${productId}`);
    // TODO: Implement API call to delete product
  };

  const handleEditProduct = (productId: number) => {
    console.log(`Editing product ${productId}`);
    // TODO: Implement edit modal
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Product Management
          </h2>
          <p className="text-gray-600">
            Manage products, pricing, and inventory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Export Products
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-white rounded-lg border border-gray-200">
        <input
          type="search"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          title="Filter by category"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          title="Filter by status"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            title="Sort by field"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title={`Sort ${sortOrder === "asc" ? "ascending" : "descending"}`}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-900">
                  Product
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Category
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Price
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Status
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Inventory
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Likes
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Sales
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Updated
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="p-4">
                    <div className="max-w-xs">
                      <p className="font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {getCategoryLabel(product.category)}
                  </td>
                  <td className="p-4 font-mono text-sm text-gray-900">
                    ${product.price.toLocaleString()}
                  </td>
                  <td className="p-4">{getStatusBadge(product.status)}</td>
                  <td className="p-4">
                    <span
                      className={`text-sm ${
                        product.inventory < 10
                          ? "text-yellow-600"
                          : "text-gray-900"
                      }`}
                    >
                      {product.inventory}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-900">{product.likes}</td>
                  <td className="p-4 text-sm text-gray-900">{product.sales}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(product.lastUpdated).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditProduct(product.id)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        title="Edit product"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(
                            product.id,
                            product.status === "active" ? "inactive" : "active"
                          )
                        }
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        title={
                          product.status === "active"
                            ? "Deactivate"
                            : "Activate"
                        }
                      >
                        {product.status === "active" ? "Hide" : "Show"}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                        title="Delete product"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {filteredAndSortedProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 truncate">
                    {product.name}
                  </h3>
                  {getStatusBadge(product.status)}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {product.description}
                </p>
                <p className="text-sm text-gray-600">
                  {getCategoryLabel(product.category)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600">Price</p>
                <p className="font-mono text-sm text-gray-900">
                  ${product.price.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Inventory</p>
                <p
                  className={`text-sm ${
                    product.inventory < 10 ? "text-yellow-600" : "text-gray-900"
                  }`}
                >
                  {product.inventory} units
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Likes</p>
                <p className="text-sm text-gray-900">{product.likes}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Sales</p>
                <p className="text-sm text-gray-900">{product.sales}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEditProduct(product.id)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() =>
                  handleStatusChange(
                    product.id,
                    product.status === "active" ? "inactive" : "active"
                  )
                }
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                {product.status === "active" ? "Hide" : "Show"}
              </button>
              <button
                onClick={() => handleDeleteProduct(product.id)}
                className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">Total Products</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {products.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">Active Products</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {products.filter((p) => p.status === "active").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">Total Sales</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {products
              .reduce((sum, product) => sum + product.sales, 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">Total Likes</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {products
              .reduce((sum, product) => sum + product.likes, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductManagementTab;
