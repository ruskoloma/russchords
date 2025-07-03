using AutoMapper;
using BackendApi.Data.Entities;
using BackendApi.Models.Dtos;

namespace BackendApi.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<SongEntity, SongDto>().ReverseMap();
        CreateMap<SongStarEntity, SongStarDto>().ReverseMap();
        CreateMap<PlaylistEntity, PlaylistDto>().ReverseMap();
        CreateMap<PlaylistSongEntity, PlaylistSongDto>().ReverseMap();
        CreateMap<PlaylistMemberEntity, PlaylistMemberDto>().ReverseMap();
    }
}