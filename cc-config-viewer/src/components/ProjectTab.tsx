import React from 'react'

interface ProjectTabProps {
  label: string
  isActive: boolean
  onClick: () => void
}

export const ProjectTab: React.FC<ProjectTabProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
